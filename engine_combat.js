// engine_combat.js – Combat Domain (Encounters, Battles, Plunder, Events)
// Registers its reducer into window.E._reducers.

(() => {
  const { A } = window.E;
  const { PORTS, FACTIONS, SURRENDER_CONSEQUENCE } = window.D;
  const D = window.D;
  const L = window.L;
  const G = window.G;

  // --- BATTLE_ACTION Helpers ---------------------------------------

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ── Build a narrative round log using the new combined templates ──────────
const buildRoundLog = (phase, playerAction, npcAction, result, battle, state) => {
  const T = D.COMBAT_LOG_TEMPLATES;
  if (!T) return "";

  const templates = T[phase];
  if (!templates) return "";

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Helper to format lost names
  const formatLostNames = (names) => {
    if (!names || names.length === 0) return "";
    const shown = names.slice(0, 3).join(", ");
    if (names.length <= 3) return ` (lost: ${shown})`;
    return ` (lost: ${shown} and ${names.length - 3} others)`;
  };

  // --- Naval phase ---
  if (phase === "naval") {
    let logs = [];

    // Determine if each side moved
    const isDistanceAction = (act) => act === "close_distance" || act === "open_distance";
    const playerMoved = isDistanceAction(playerAction);
    const enemyMoved = isDistanceAction(npcAction);

    // 1. Distance change logs (if either side moved)
    if (playerMoved && !enemyMoved) {
      // Player moved alone
      const key = playerAction === "close_distance" ? "close_distance_success" : "open_distance_success";
      const pool = templates.player[key];
      if (pool) {
        const log = pick(pool).replace(/\{distance\}/g, result.newDistance || battle.distance);
        logs.push(log);
      } else {
        logs.push(`You move to ${result.newDistance || battle.distance} range.`);
      }
    } else if (enemyMoved && !playerMoved) {
      // Enemy moved alone
      const key = npcAction === "close_distance" ? "close_distance_success" : "open_distance_success";
      const pool = templates.npc[key];
      if (pool) {
        const log = pick(pool).replace(/\{distance\}/g, result.newDistance || battle.distance);
        logs.push(log);
      } else {
        logs.push(`The enemy moves to ${result.newDistance || battle.distance} range.`);
      }
    } else if (playerMoved && enemyMoved) {
      // Both moved – combined template
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

  // ── Apply crew loss to state and return updated state with log ──
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

  // Build a captain's‑log message for battle‑end events (victory/defeat/grapple win)
  const buildCaptainLog = (state, type, newRoster, extra = "") => {
    const battle = state.encounterSession?.battle;
    const initialCrew = battle?.initialPlayerCrew ?? state.crew.roster.length;
    const totalLost = initialCrew - newRoster.length;
    const lostNames = battle?.lostCrewNames ?? [];

    let msg = "";
    if (type === "grapple_win") {
      msg = "Victory! Boarding successful.";
    } else if (type === "sink_win") {
      msg = "You sunk the enemy ship.";
    } else if (type === "defeat") {
      msg = "Defeated! Your ship was destroyed.";
    }
    if (totalLost > 0) {
      const some = lostNames.slice(0, 3).join(", ");
      msg += ` Lost ${totalLost} crew, including ${some}.`;
    }
    msg += extra;
    return msg;
  };

  // Apply alignment penalty and return new morale + possible extra message fragment
  const applyAlignment = (state, newMorale) => {
    const enemyFaction = state.encounterSession?.enemy?.faction;
    if (!enemyFaction) return { morale: newMorale, logExtra: "" };

    const alignmentPenalty = Math.round(3 * L.getAlignmentModifier(state, enemyFaction));
    const finalMorale = Math.max(0, newMorale - alignmentPenalty);
    const logExtra = alignmentPenalty > 3
      ? ` Your ${enemyFaction}-majority crew is furious about this.`
      : "";
    return { morale: finalMorale, logExtra };
  };

  // ── WASH ASHORE (generalized defeat helper) ───────────────────
  const washAshore = (state, battleState = null, extraLog = []) => {
    const returnPort = state.previousPort || state.currentPort;
    const portName = D.PORTS[returnPort]?.name || "a nearby port";

    // If battleState is provided (combat defeat path), use it to determine mission failure.
    // Otherwise, this is an event-triggered hull-zero.
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

    // Check for unrecoverable state before returning
    const check = L.isUnrecoverable(result);
    if (check.unrecoverable) {
      return { ...result, screen: "gameover", gameOverReason: check.reason };
    }
    return result;
  };

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

  const handlePatrolVictory = (currentState, battleState) => {
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

  // ── Event handling helpers (extracted from RESOLVE_EVENT) ────

  // Handles the mutiny event outcome. Returns a state update to merge with newState.
  const handleMutinyOutcome = (state, event, choice, newState) => {
    const roster = state.crew?.roster || [];
    if (choice === event.choices[0]) { // Negotiate
      const mutinyCost = roster.length * 10;
      if (state.gold >= mutinyCost) {
        newState.gold = Math.max(0, newState.gold - mutinyCost);
        newState.crew = {
          ...newState.crew,
          morale: Math.min(100, (newState.crew?.morale || state.crew.morale) + 20)
        };
        newState.log = [...(newState.log || []),
          `You promise better conditions, costing ${mutinyCost}g. The crew stands down… for now.`
        ];
      } else {
        const upsetCount = Math.ceil(roster.length * 0.30);
        const shuffled = [...roster].sort(() => Math.random() - 0.5);
        const upsetNames = [];
        const updatedRoster = roster.map(member => {
          if (shuffled.indexOf(member) < upsetCount) {
            upsetNames.push(`${member.firstName} ${member.lastName}`);
            return L.addTag(member, "upset");
          }
          return member;
        });
        newState.crew = {
          ...newState.crew,
          roster: updatedRoster,
          morale: Math.max(0, (newState.crew?.morale || state.crew.morale) - 5)
        };
        const nameList = upsetNames.length === 1
          ? upsetNames[0]
          : upsetNames.length === 2
            ? `${upsetNames[0]} and ${upsetNames[1]}`
            : "Several crew members";
        newState.log = [...(newState.log || []),
          `You promise better conditions, but the crew sees through your empty words. ${nameList} ${upsetNames.length === 1 ? 'is' : 'are'} now upset.`
        ];
      }
    } else { // Crush
      const survivors = newState.crew?.roster || roster;
      const mutineerCount = Math.ceil(survivors.length * 0.30);
      if (mutineerCount > 0) {
        const shuffled = [...survivors].sort(() => Math.random() - 0.5);
        const tagged = [];
        const updatedRoster = survivors.map(member => {
          if (shuffled.indexOf(member) < mutineerCount) {
            tagged.push(`${member.firstName} ${member.lastName}`);
            return L.addTag(member, "mutineer");
          }
          return member;
        });
        newState.crew = { ...newState.crew, roster: updatedRoster };
        const names = tagged.length === 1
          ? tagged[0]
          : tagged.length === 2
            ? `${tagged[0]} and ${tagged[1]}`
            : "Several survivors";
        newState.log = [...(newState.log || []),
          `${names} emerged as ringleaders. They are marked as mutineers.`
        ];
      }
    }
    return newState;
  };

  const applyStormScar = (roster) => {
    const eligible = roster.filter(m => !L.hasTag(m, "scar_storm"));
    const fraction = 0.2 + Math.random() * 0.2;
    return roster.map(member => {
      if (!L.hasTag(member, "scar_storm") && Math.random() < fraction) {
        return L.addTag(member, "scar_storm");
      }
      return member;
    });
  };

  // ── Reducer ──────────────────────────────────────────────────
  window.E._reducers.push((state, action) => {
    switch (action.type) {

      // ── INTERCEPT ACTIONS ──────────────────────────────────

      case A.INTERCEPT_FIGHT: {
        //guardrail against starting a fight with 0HP
        if (state.ship.hull === 0) {
          return { ...state, log: [...state.log,
            window.E.logEntry(state, "There is no fighting to be done — the ship is already lost.")] };
        }

        const session = state.encounterSession;
        if (!session || session.phase !== "intercept") return state;

        // ── Build battle sub-object ──────────────────────────────
        const battle = {
          round: 1,
          log: [`You engage the ${session.enemy.name}!`],
          playerHull: state.ship.hull,
          playerCrew: state.crew.roster.length,
          initialPlayerCrew: state.crew.roster.length,
          lostCrewNames: [],
          enemyHull: session.enemy.hull,
          enemyCrew: session.enemy.crew,
          distance: window.L.initialDistanceFor(session.type),
          subPhase: "naval",
          // Escort missions: add convoyHull
          ...(session.type === "escort_defend" ? { convoyHull: 50 } : {}),
        };

        // ── Tutorial hunt: free opening shot modifier ──────────
        let modifiers = session.modifiers || [];
        if (state.activeMission?.tutorial && !state.activeMission?.requiredGood) {
          battle.log = ["The Rat fires a hasty shot, grazing your hull!", ...battle.log];
          battle.playerHull = Math.max(0, battle.playerHull - 1);
          modifiers = [
            ...modifiers,
            { id: "tutorial_warmup", scope: "battle_start", effect: { playerHullDelta: -1 } }
          ];
        }

        // ── Transition session to battle phase ──────────────────
        const newSession = {
          ...session,
          phase: "battle",
          modifiers: modifiers,
          intercept: null,
          battle: battle,
          plunder: null,
        };

        // ── Heat for fighting a navy patrol ─────────────────────
        let s = { ...state, encounterSession: newSession, screen: "battle" };
        if (session.type === "navy_patrol" || session.type === "navy_patrol_combat") {
          s = L.addHeat(s, session.enemy.faction, 3);
        }
        return s;
      }

      case A.INTERCEPT_FLEE: {
        const ctx = state.encounterSession;
        if (!ctx) return state;
        const fleeOpt = ctx.intercept?.options?.find(o => o.id === "flee");
        if (!fleeOpt) return state;
        const { player, enemy } = fleeOpt.speedCheck;
        const playerRoll = player + L.roll(6);
        const enemyRoll  = enemy  + L.roll(6);
        if (playerRoll >= enemyRoll) {
          let s = { ...state, encounterSession: null, screen: L.returnScreen(state), log: [...state.log, "You pulled clear, the enemy couldn't keep up."] };
          if (ctx.type === "navy_patrol" || ctx.type === "navy_patrol_combat") {
            s = L.addHeat(s, ctx.enemy.faction, 2);
          }
          return s;
        }
        // ── Failed flee → transition to battle ──────────────────
        const battle = {
          round: 1,
          log: ["Escape failed! The enemy closes in."],
          playerHull: state.ship.hull,
          playerCrew: state.crew.roster.length,
          initialPlayerCrew: state.crew.roster.length,
          lostCrewNames: [],
          enemyHull: ctx.enemy.hull,
          enemyCrew: ctx.enemy.crew,
          distance: window.L.initialDistanceFor(ctx.type),
          subPhase: "naval",
          ...(ctx.type === "escort_defend" ? { convoyHull: 50 } : {}),
        };
        const newSession = {
          ...ctx,
          phase: "battle",
          intercept: null,
          battle: battle,
          plunder: null,
        };
        return {
          ...state,
          encounterSession: newSession,
          screen: "battle",
          log: [...state.log, "Failed to escape. The battle is unavoidable."]
        };
      }

      case A.INTERCEPT_PARLEY: {
        const ctx = state.encounterSession;
        if (!ctx) return state;
        const rep = state.reputation[state.destination ?? state.currentPort] ?? 20;
        const success = L.roll(100) <= Math.min(80, rep + 20);
        if (success) {
          const portKey = state.destination ?? state.currentPort;
          return {
            ...state,
            encounterSession: null,
            screen: L.returnScreen(state),
            reputation: { ...state.reputation, [portKey]: Math.min(100, (state.reputation[portKey] ?? 20) + 3) },
            log: [...state.log, "Parley successful. They let you pass."]
          };
        }
        // ── Failed parley → transition to battle ────────────────
        const battle = {
          round: 1,
          log: ["Your parley failed. They attack!"],
          playerHull: state.ship.hull,
          playerCrew: state.crew.roster.length,
          initialPlayerCrew: state.crew.roster.length,
          lostCrewNames: [],
          enemyHull: session.enemy.hull,
          enemyCrew: session.enemy.crew,
          distance: window.L.initialDistanceFor(ctx.type),
          subPhase: "naval",
          ...(ctx.type === "escort_defend" ? { convoyHull: 50 } : {}),
        };
        const newSession = {
          ...ctx,
          phase: "battle",
          intercept: null,
          battle: battle,
          plunder: null,
        };
        return {
          ...state,
          encounterSession: newSession,
          screen: "battle",
          log: [...state.log, "Parley failed. Battle unavoidable."]
        };
      }

      case A.INTERCEPT_BRIBE: {
          console.log("[INTERCEPT_BRIBE] Dispatched with state:", state);

        const ctx = state.encounterSession;
        if (!ctx || ctx.phase !== "intercept") return state;

        const bribeOpt = ctx.intercept?.options?.find(o => o.id === "bribe");
        if (!bribeOpt) {
          console.warn("[INTERCEPT_BRIBE] No bribe option found in intercept options.");
          return state;
        }

        const cost = Number(bribeOpt.cost);
        if (isNaN(cost) || cost <= 0) {
          console.warn("[INTERCEPT_BRIBE] Invalid bribe cost:", bribeOpt.cost);
          return { ...state, log: [...state.log, "Bribe cost invalid. Cannot proceed."] };
        }

        if (state.gold < cost) {
          return { ...state, log: [...state.log, `Not enough gold for bribe (need ${cost}g).`] };
        }

        const portKey = state.destination ?? state.currentPort;
        return {
          ...state,
          encounterSession: null,
          gold: state.gold - cost,
          reputation: { ...state.reputation, [portKey]: Math.max(0, (state.reputation[portKey] ?? 20) - 2) },
          screen: L.returnScreen(state),
          log: [...state.log, `Bribed them with ${cost}g. They looked the other way.`]
        };
      }

      case A.INTERCEPT_SURRENDER: {
        const ctx = state.encounterSession;
        if (!ctx) return state;
        const consequence = SURRENDER_CONSEQUENCE[ctx.type] ?? SURRENDER_CONSEQUENCE.random;

        let s = { ...state, encounterSession: null };

        if (consequence.goldFine) s.gold = Math.max(0, s.gold - consequence.goldFine);
        if (consequence.loseGoldPercent) s.gold = Math.max(0, Math.round(s.gold * (1 - consequence.loseGoldPercent / 100)));
        if (consequence.moralePenalty) s.crew = { ...s.crew, morale: Math.max(0, s.crew.morale - consequence.moralePenalty) };
        if (consequence.loseDays) { s.day += consequence.loseDays; }
        if (consequence.rep_loss) {
          const portKey = state.destination ?? state.currentPort;
          s.reputation = { ...s.reputation, [portKey]: Math.max(0, (s.reputation[portKey] ?? 20) - consequence.rep_loss) };
        }

        let newHoldItems = { ...(state.hold?.items || {}) };
        const logDetails = [];

        if (consequence.goldFine) logDetails.push(`Gold fine: −${consequence.goldFine}g`);
        if (consequence.loseGoldPercent) {
          const lostGold = Math.round(state.gold * (consequence.loseGoldPercent / 100));
          logDetails.push(`Lost ${consequence.loseGoldPercent}% of your gold (−${lostGold}g)`);
        }
        if (consequence.moralePenalty) logDetails.push(`Crew morale −${consequence.moralePenalty}`);
        if (consequence.loseDays) logDetails.push(`Imprisoned for ${consequence.loseDays} day${consequence.loseDays !== 1 ? 's' : ''}`);
        if (consequence.rep_loss) logDetails.push(`Reputation with local faction −${consequence.rep_loss}`);
        if (consequence.loseCargoPercent) {
          newHoldItems = L.applyLoseCargoPercent(newHoldItems, consequence.loseCargoPercent);
          logDetails.push(`${consequence.loseCargoPercent}% of your cargo was seized`);
        }
        if (consequence.loseContraband) {
          newHoldItems = L.applyLoseContraband(newHoldItems);
          logDetails.push("All contraband was confiscated");
        }

        s.hold = { ...state.hold, items: newHoldItems };
        s.screen = L.returnScreen(state);
        s.log = [
          ...state.log,
          "You surrendered. Here is what it cost you:",
          ...logDetails.map(line => `  • ${line}`),
        ];
        return s;
      }

      // --- PATROL INSPECTION ---
      case A.PATROL_INSPECT: {
        const activeMission = state.activeMission;
        const items = state.hold?.items || {};

        const hasTobacco   = (items.tobacco || 0) > 0;
        const hasSlaves    = (items.slaves  || 0) > 0;
        const hasRumSmuggle = activeMission?.requiredGood === "rum"
          && (items.rum || 0) >= (activeMission?.requiredQty || 0);
        const hasContraband = hasTobacco || hasSlaves || hasRumSmuggle;

        if (!hasContraband) {
          return {
            ...state,
            encounterSession: null,
            screen: L.returnScreen(state),
            log: [...state.log, "The patrol found nothing. You are waved through."],
          };
        }

        const avoidChance = L.getEquipmentEffect(state, "contrabandAvoidChance") || 0;
        if (avoidChance > 0 && Math.random() < avoidChance) {
          return {
            ...state,
            encounterSession: null,
            screen: L.returnScreen(state),
            log: [...state.log, "The patrol searches your hold but finds nothing. The hidden compartment does its job."],
          };
        }

        let seizedValue = 0;
        if (hasTobacco) seizedValue += (items.tobacco || 0) * (D.RESOURCES.tobacco?.basePrice || 90);
        if (hasSlaves)  seizedValue += (items.slaves  || 0) * (D.RESOURCES.slaves?.basePrice  || 220);
        if (hasRumSmuggle) seizedValue += (activeMission.requiredQty || 0) * (D.RESOURCES.rum?.basePrice || 30);

        const fine = Math.round(seizedValue * (D.PATROL_FINE_RATE || 0.50) / 25) * 25;
        const newHoldItems = L.applyLoseContraband(items);

        const inspectingFaction = PORTS[state.destination ?? state.currentPort]?.faction || null;
        let newRep = { ...state.reputation };
        if (inspectingFaction) {
          Object.keys(PORTS).forEach(portKey => {
            if (PORTS[portKey].faction === inspectingFaction) {
              newRep[portKey] = Math.max(0, (newRep[portKey] ?? 50) - 5);
            }
          });
        }

        return {
          ...state,
          encounterSession: null,
          screen: L.returnScreen(state),
          gold:       Math.max(0, state.gold - fine),
          hold:       { ...state.hold, items: newHoldItems },
          infamy:     Math.min(999, (state.infamy ?? 0) + 2),
          reputation: newRep,
          crew:       { ...state.crew, morale: Math.max(0, state.crew.morale - 10) },
          log: [
            ...state.log,
            "The patrol found contraband. All illegal goods seized.",
            `Fine levied: ${fine}g.`,
            "+2 infamy. Your name is in their ledger now.",
            "The crew's morale drops.",
          ],
        };
      }

      // ── COMBAT ──────────────────────────────────────────────

 case A.BATTLE_ACTION: {
  const session = state.encounterSession;
  if (!session || session.phase !== "battle" || !session.battle) return state;

  const battle = session.battle;
  const enemy = session.enemy;

  // ── Get NPC action based on subPhase ──────────────────────────────
  let enemyAction;
  if (battle.subPhase === "naval") {
    enemyAction = L.getNPCNavalAction(battle, enemy);
  } else {
    const ratio = L.getBoardingRatio(state, battle, enemy);
    enemyAction = L.getNPCBoardingAction(battle, enemy, ratio);
  }

  // ── Resolve the round ──────────────────────────────────────────────
  let result;
  if (battle.subPhase === "naval") {
    result = L.resolveNavalRound(state, action.action, enemyAction, battle, enemy);
  } else {
    result = L.resolveBoardingRound(state, action.action, enemyAction, battle, enemy);
  }

  const newLog = [...battle.log];

  // ── Build the narrative log using the combined templates ──────────
  const phase = battle.subPhase;
  const playerAction = action.action;
  const roundLog = buildRoundLog(phase, playerAction, enemyAction, result, battle, state);
  if (roundLog) {
    newLog.push(roundLog);
  }

  // ── Process outcome ────────────────────────────────────────────────
  switch (result.outcome) {
    // ── Evade – immediate session clear ──────────────────────────────
    case "player_evaded":
    case "enemy_evaded": {
      const who = result.outcome === "player_evaded" ? "You" : "The enemy";
      const logMsg = `${who} evaded successfully and broke contact.`;
      const newScreen = L.returnScreen(state);
      let nextState = { ...state, encounterSession: null, screen: newScreen, log: [...state.log, window.E.logEntry(state, logMsg)] };
      // Abandon mission if this was a mission combat or escort defend
      const sessionType = state.encounterSession?.type;
      if ((sessionType === "mission_combat" || sessionType === "escort_defend") && state.activeMission) {
        nextState.activeMission = null;
        nextState.log.push(window.E.logEntry(state, "The mission has been abandoned."));
      }
      return nextState;
    }

    // ── Boarding transition – stays in battle ──────────────────────
    case "boarding_begins": {
      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newPlayerCrew = updatedState.crew.roster.length;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

      const newBattle = {
        ...battle,
        playerHull: battle.playerHull,                    // unchanged
        enemyHull: battle.enemyHull,                      // unchanged
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

    // ── Return to naval (Fall Back) – stays in battle ──────────────
    case "returned_to_naval": {
      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newPlayerCrew = updatedState.crew.roster.length;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

      const newBattle = {
        ...battle,
        playerHull: battle.playerHull,                    // unchanged
        enemyHull: battle.enemyHull,                      // unchanged
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

    // ── Continue – stay in battle, next round ──────────────────────
    case "continue":
    default: {
      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newPlayerCrew = updatedState.crew.roster.length;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

      // ── Only apply hull damage during naval phase ──────────────────
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

    // ── PLAYER DEFEAT – stay in battle, phase = defeat ────────────
    case "player_sunk":
    case "player_captured": {
      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];
      const logMsg = "Your crew is overwhelmed. The enemy takes your ship!";

      // Small ship exception – do NOT set defeat, do NOT add extra log.
      const isSmallShip = state.ship.type === "dinghy" || state.ship.type === "cutter";
      if (isSmallShip && battle.playerHull > 0) {
        // The captain fights on alone; we simply keep the battle alive.
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
          log: updatedState.log, // no extra log
        };
      }

      // Normal defeat
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
        log: [...updatedState.log, window.E.logEntry(updatedState, logMsg)],
      };
    }

    // ── ENEMY DEFEAT – stay in battle, phase = victory ────────────
    case "enemy_sunk":
    case "enemy_captured": {
      const isSunk = result.outcome === "enemy_sunk";
      const logMsg = isSunk
        ? `The ${enemy.name} is sunk!`
        : `The ${enemy.name} is captured!`;
      const canPlunder = !isSunk;

      let goldReward = 0;
      let enemyCargo = {};
      if (canPlunder) {
        const plunder = G.generateEnemyCargo(state, enemy, enemy.risk || "medium");
        goldReward = plunder.gold;
        enemyCargo = plunder.cargo;
      }

      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newPlayerCrew = updatedState.crew.roster.length;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

      const newBattle = {
        ...battle,
        playerHull: Math.max(0, battle.playerHull - result.playerHullDamage),
        playerCrew: newPlayerCrew,
        enemyHull: Math.max(0, battle.enemyHull - result.enemyHullDamage),
        enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
        phase: "victory",
        canPlunder,
        goldReward,
        enemyCargo,
        log: newLog,
        lostCrewNames: newLostNames,
      };
      const newSession = { ...session, battle: newBattle };
      let currentState = applyVictoryAftermath({ ...updatedState, encounterSession: newSession });

      if (canPlunder) {
        return {
          ...currentState,
          encounterSession: { ...newSession, phase: "plunder" },
          screen: "plunder",
          log: [...currentState.log, window.E.logEntry(currentState, logMsg)],
        };
      } else {
        return {
          ...currentState,
          encounterSession: null,
          screen: session.returnScreen === "sailing" && currentState.destination && currentState.sailingDaysLeft > 0
            ? "sailing" : "port",
          log: [...currentState.log, window.E.logEntry(currentState, logMsg)],
        };
      }
    }

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
          log: updatedState.log, // no extra log
        };
      }

      // Normal defeat
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

    case "enemy_wipeout": {
      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newPlayerCrew = updatedState.crew.roster.length;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

      const plunder = G.generateEnemyCargo(state, enemy, enemy.risk || "medium");
      const logMsg = `The ${enemy.name}'s crew is wiped out!`;

      const newBattle = {
        ...battle,
        playerCrew: newPlayerCrew,
        enemyCrew: 0,
        phase: "victory",
        canPlunder: true,
        goldReward: plunder.gold,
        enemyCargo: plunder.cargo,
        log: newLog,
        lostCrewNames: newLostNames,
      };
      const newSession = { ...session, battle: newBattle };
      let currentState = applyVictoryAftermath({ ...updatedState, encounterSession: newSession });
      return {
        ...currentState,
        encounterSession: { ...newSession, phase: "plunder" },
        screen: "plunder",
        log: [...currentState.log, window.E.logEntry(currentState, logMsg)],
      };
    }

    case "player_defeated_by_demand": {
      const newBattle = {
        ...battle,
        phase: "defeat",
        log: newLog,
      };
      const newSession = { ...session, battle: newBattle };
      return { ...state, encounterSession: newSession };
    }

    case "enemy_win_capture": {
      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newPlayerCrew = updatedState.crew.roster.length;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

      const plunder = G.generateEnemyCargo(state, enemy, enemy.risk || "medium");
      const logMsg = `The ${enemy.name} surrenders!`;

      const newBattle = {
        ...battle,
        playerCrew: newPlayerCrew,
        phase: "victory",
        canPlunder: true,
        goldReward: plunder.gold,
        enemyCargo: plunder.cargo,
        log: newLog,
        lostCrewNames: newLostNames,
      };
      const newSession = { ...session, battle: newBattle };
      let currentState = applyVictoryAftermath({ ...updatedState, encounterSession: newSession });
      return {
        ...currentState,
        encounterSession: { ...newSession, phase: "plunder" },
        screen: "plunder",
        log: [...currentState.log, window.E.logEntry(currentState, logMsg)],
      };
    }

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

    case "enemy_surrendered": {
      const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
      const updatedState = crewResult.state;
      const newPlayerCrew = updatedState.crew.roster.length;
      const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

      const plunder = G.generateEnemyCargo(state, enemy, enemy.risk || "medium");
      const logMsg = `The ${enemy.name} surrenders!`;

      const newBattle = {
        ...battle,
        playerCrew: newPlayerCrew,
        phase: "victory",
        canPlunder: true,
        goldReward: plunder.gold,
        enemyCargo: plunder.cargo,
        log: newLog,
        lostCrewNames: newLostNames,
      };
      const newSession = { ...session, battle: newBattle };
      let currentState = applyVictoryAftermath({ ...updatedState, encounterSession: newSession });
      return {
        ...currentState,
        encounterSession: { ...newSession, phase: "plunder" },
        screen: "plunder",
        log: [...currentState.log, window.E.logEntry(currentState, logMsg)],
      };
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

        return {
          ...state,
          gold: state.gold + goldReward,
          hold: { ...state.hold, items: finalHoldItems },
          encounterSession: null,
          screen: session.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0
            ? "sailing" : "port",
          log: [...state.log, `${plunderMsg} +${goldReward}g.`],
        };
      }

      // ── EVENTS ──────────────────────────────────────────────

      case A.RESOLVE_EVENT: {
        const event = state.activeEvent;
        if (!event) return state;

        const choice = event.choices[action.choiceIndex];
        const newState = { ...state, activeEvent: null };

        if (choice.outcome.log) newState.log = [...state.log, choice.outcome.log];
        if (choice.outcome.gold) newState.gold = Math.max(0, state.gold + choice.outcome.gold);

        // ── Event‑specific handlers ──────────────────────────────
        if (event.id === "mutiny") {
          handleMutinyOutcome(state, event, choice, newState);
        } else if (event.id === "storm") {
          newState.crew = {
            ...newState.crew,
            roster: applyStormScar(newState.crew?.roster || state.crew.roster),
          };
        }

        // ── Generic outcome fields ──────────────────────────────
        if (choice.outcome.fame) newState.fame += choice.outcome.fame;
        if (choice.outcome.hullDamage) {
          if (event.id === "storm" && L.getEquipmentEffect(newState, "stormHullImmune")) {
            newState.log = [...newState.log, "The storm batters your ship, but the reinforced rigging holds."];
          } else {
            const newHull = Math.max(0, state.ship.hull - choice.outcome.hullDamage);
            newState.ship = { ...state.ship, hull: newHull };
            // If hull reaches 0, wash ashore immediately
            if (newHull === 0) {
              return washAshore(newState);
            }
          }
        }
        if (choice.outcome.crewLoss) {
          const roster = state.crew?.roster || [];
          const actualLoss = Math.min(choice.outcome.crewLoss, roster.length);
          if (actualLoss > 0) {
            const { newRoster, removed } = L.removeRandomCrew(roster, actualLoss);
            newState.crew = { ...newState.crew, roster: newRoster };
            const names = removed.map(m => `${m.firstName} ${m.lastName}`).join(", ");
            newState.log = [...newState.log, `Lost ${actualLoss} crew: ${names}.`];
          } else {
            newState.log = [...newState.log, "The storm rages, but there is no one to lose."];
          }
        }
        if (choice.outcome.loseCargoPercent) {
          const newHoldItems = L.applyLoseCargoPercent(state.hold?.items || {}, choice.outcome.loseCargoPercent);
          newState.hold = { ...state.hold, items: newHoldItems };
          newState.log = [...newState.log, `${choice.outcome.loseCargoPercent}% of your cargo was lost.`];
        }
        if (choice.outcome.daysLost) {
          const isCalmWind = event?.id === "calm_winds";
          const hasCalmImmune = L.getEquipmentEffect(newState, "calmImmune");
          if (isCalmWind && hasCalmImmune) {
            newState.log = [...newState.log, "The wind dies completely, but your seasoned hull drifts onward without delay."];
          } else {
            const lost = choice.outcome.daysLost;
            newState.day += lost;
            newState.sailingDaysTotal = (state.sailingDaysTotal || 0) + lost;
            newState.sailingDaysLeft = (state.sailingDaysLeft || 0) + lost;
            newState.gold = Math.max(0, newState.gold - L.payCrewWages(state) * lost);
            let rep = { ...state.reputation };
            for (let i = 0; i < lost; i++) rep = L.decayReputation({ reputation: rep });
            newState.reputation = rep;
          }
        }
        if (choice.outcome.repImpact) newState.reputation = L.applyReputationImpact(state, choice.outcome.repImpact);
        if (choice.outcome.moraleBonus) newState.crew = { ...newState.crew, morale: Math.max(0, Math.min(100, (newState.crew.morale || state.crew.morale) + choice.outcome.moraleBonus)) };

        if (choice.outcome.battle) {
          const encounterType = event.id === "navy_patrol" ? "navy_patrol_combat" : "patrol";
          const patrolFaction = PORTS[state.destination]?.faction || "english";
          const patrolEnemy = {
            ...choice.outcome.battle.enemy,
            faction: patrolFaction,
            name: `${FACTIONS[patrolFaction]?.label || "Colonial"} Patrol`,
          };
          const context = L.buildEncounterContext(state, encounterType, patrolEnemy);
          // ── B1.4 batch: use encounterSession instead of encounterContext ──
          // We need to import buildEncounterSession from window.E
          const buildEncounterSession = window.E.buildEncounterSession;
          newState.encounterSession = buildEncounterSession(state, context);
          newState.screen = "intercept";
        } else {
          newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
        }

        if (choice.outcome.mapFragment) {
          const fragment = choice.outcome.mapFragment;
          const alreadyHave = (newState.mapFragments || state.mapFragments).includes(fragment);
          if (!alreadyHave) {
            newState.mapFragments = [...(newState.mapFragments || []), fragment];
            Object.entries(PORTS).forEach(([portKey, port]) => {
              if (!port.hidden) return;
              if ((newState.discoveredPorts || []).includes(portKey)) return;
              const cond = port.unlockCondition?.conditions || [];
              const itemCond = cond.find(c => c.type === "item" && c.value === fragment);
              if (itemCond) {
                newState.discoveredPorts = [...(newState.discoveredPorts || []), portKey];
                newState.log = [...newState.log, ` New port discovered: ${port.name}. The chart reveals everything.`];
              }
            });
          }
        }

        if (choice.outcome.generateCargo) {
          const { risk, faction } = choice.outcome.generateCargo;
          const fakeEnemy = { faction: faction || "english", hull: 50, cannons: 4, crew: 10 };
          const { gold: plunderGold, cargo } = G.generateEnemyCargo(state, fakeEnemy, risk || "low");
          newState.gold = (newState.gold || state.gold) + plunderGold;
          const items = { ...(newState.hold?.items || {}) };
          const capacity = L.getHoldCapacity(state);
          let used = L.getHoldUsed(items);
          let anySkipped = false;
          Object.entries(cargo).forEach(([good, qty]) => {
            const canFit = Math.max(0, capacity - used);
            const added = Math.min(qty, canFit);
            if (added > 0) { items[good] = (items[good] || 0) + added; used += added; }
            if (added < qty) anySkipped = true;
          });
          newState.hold = { ...newState.hold, items };
          if (anySkipped) newState.log = [...newState.log, "Your hold is too full to take everything."];
        }

        if (choice.outcome.addCrew) {
          const { count, faction, tags, negativeTagChance } = choice.outcome.addCrew;
          const negativeTags = ["hidden_troublemaker", "hidden_drunkard", "hidden_coward", "hidden_greedy"];
          const factions = faction ? [faction] : ["english", "spanish", "french", "dutch", "pirate"];
          const existingNames = state.crew.roster.map(c => `${c.firstName} ${c.lastName}`);
          const newMembers = [];
          for (let i = 0; i < (count || 1); i++) {
            const randFaction = factions[Math.floor(Math.random() * factions.length)];
            const member = G.generateCrewMember(randFaction, existingNames);
            member.tags = [...(member.tags || [])];
            if (i === 0 && tags?.length) member.tags.push(...tags);
            newMembers.push(member);
            existingNames.push(`${member.firstName} ${member.lastName}`);
          }
          if (negativeTagChance && Math.random() < negativeTagChance && newMembers.length > 0) {
            const unlucky = newMembers[Math.floor(Math.random() * newMembers.length)];
            unlucky.tags.push(negativeTags[Math.floor(Math.random() * negativeTags.length)]);
          }
          const names = newMembers.map(m => `${m.firstName} ${m.lastName}`).join(", ");
          const combinedRoster = [...state.crew.roster, ...newMembers];
          const maxCrew = L.getShipStats(state).maxCrew;
          const cappedRoster = combinedRoster.slice(0, maxCrew);
          const turnedAway = combinedRoster.length - cappedRoster.length;
          newState.crew = { ...newState.crew, roster: cappedRoster };
          newState.log = [...newState.log,
            turnedAway > 0
              ? `${newMembers.length === 1 ? names + " joins" : names + " join"} your crew, but ${turnedAway === 1 ? 'one was' : turnedAway + ' were'} turned away : your ship can only hold ${maxCrew}.`
              : `${newMembers.length === 1 ? names + " joins" : names + " join"} your crew.`
          ];
        }

        if (choice.outcome.action) {
          if (choice.outcome.log && !newState.log.includes(choice.outcome.log)) {
            newState.log = [...newState.log, choice.outcome.log];
          }
          return window.E.reducer({ ...newState, activeEvent: null }, { type: choice.outcome.action });
        }

        return newState;
      }

      // --- Merchant Encounters ---
      case A.ATTACK_PIRATE: {
        const pirateEnemy = G.generateEnemy("medium", state.fame, "pirate");
        const context = L.buildEncounterContext(state, "distressed_merchant_help", pirateEnemy);
        // ── B1.4 batch: use encounterSession instead of encounterContext ──
        const buildEncounterSession = window.E.buildEncounterSession;
        const encounterSession = buildEncounterSession(state, context);
        return {
          ...state,
          encounterSession,
          screen: "intercept",
          log: [...state.log, "You rush to the merchant's aid."]
        };
      }

      case A.ATTACK_MERCHANT: {
        const faction = G.pickMerchantFaction();
        const currentTier = L.getFameInfo(state.fame).tier;
        const lowerTier = Math.max(0, currentTier - 1);
        const lowerFame = lowerTier === 0 ? 0 : lowerTier * 50;
        const merchantEnemy = G.generateEnemy("low", lowerFame, faction);
        merchantEnemy.name = "Merchant Vessel";
        const context = L.buildEncounterContext(state, "distressed_merchant_plunder", merchantEnemy);
        // ── B1.4 batch: use encounterSession instead of encounterContext ──
        const buildEncounterSession = window.E.buildEncounterSession;
        const encounterSession = buildEncounterSession(state, context);

        return L.addHeat(
          {
            ...state,
            encounterSession,
            screen: "intercept",
            log: [...state.log, "You turn on the merchant."]
          },
          faction,
          2
        );
      }

      case A.RESOLVE_DRIFTING_WRECK_SEARCH: {
        const roll = Math.random();
        let newState = { ...state, activeEvent: null, screen: "sailing" };

        if (roll < 0.50) {
          const factions = ["english","spanish","french","dutch"];
          const fakeEnemy = { faction: factions[Math.floor(Math.random() * factions.length)], hull: 50, cannons: 4, crew: 10 };
          const { gold, cargo } = G.generateEnemyCargo(state, fakeEnemy, "low");
          newState.gold = state.gold + gold;
          const items = { ...(state.hold?.items || {}) };
          const capacity = L.getHoldCapacity(state);
          let used = L.getHoldUsed(items);
          let skipped = false;
          Object.entries(cargo).forEach(([good, qty]) => {
            const fit = Math.min(qty, Math.max(0, capacity - used));
            if (fit > 0) { items[good] = (items[good] || 0) + fit; used += fit; }
            if (fit < qty) skipped = true;
          });
          newState.hold = { ...state.hold, items };
          newState.log = [...state.log,
            `You find salvageable cargo in the wreck! +${gold}g.`,
            ...(skipped ? ["Your hold is too full to take everything."] : [])
          ];
        } else if (roll < 0.70) {
          newState.log = [...state.log, "The wreck is empty. Looters got here before you."];
        } else if (roll < 0.90) {
          const factions = ["english","spanish","french","dutch","pirate"];
          const member = G.generateCrewMember(
            factions[Math.floor(Math.random() * factions.length)],
            state.crew.roster.map(c => `${c.firstName} ${c.lastName}`)
          );
          member.tags = [...(member.tags || []), "scar_shipwreck"];
          const maxCrew = L.getShipStats(state).maxCrew;
          const currentCount = state.crew.roster.length;
          if (currentCount < maxCrew) {
            newState.crew = { ...state.crew, roster: [...state.crew.roster, member] };
            newState.log = [...state.log,
              `You find a survivor clinging to the wreckage. ${member.firstName} ${member.lastName}, battered but alive.`
            ];
          } else {
            newState.crew = { ...state.crew };
            newState.log = [...state.log,
              `You find a survivor clinging to the wreckage, but your ship is already at full capacity. ${member.firstName} ${member.lastName} is left with the wreck.`
            ];
          }
        }
        return newState;
      }

      default:
        return state;
    }
  });
})();