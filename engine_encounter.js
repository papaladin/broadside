// @ts-check
// engine_encounter.js – Encounter Setup & Events (Intercept, Events, Merchant Encounters)
// Registers its reducer into window.E._reducers.
// Depends on engine_core.js for A and buildEncounterSession, logic for combat helpers.

(() => {
  const { A, buildEncounterSession } = window.E;
  const { PORTS, FACTIONS, SURRENDER_CONSEQUENCE } = window.D;
  const D = window.D;
  const L = window.L;
  const G = window.G;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Builds the battle sub‑object from an intercept session.
  // Used by INTERCEPT_FIGHT, INTERCEPT_FLEE (failure), and INTERCEPT_PARLEY (failure).
    const createBattleState = (state, session, options = {}) => {
      const { subPhase = "naval", distance = window.L.initialDistanceFor(session.type), openingLog = `You engage the ${session.enemy.name}!` } = options;
      const battle = {
        round: 1,
        log: [openingLog],
        playerHull: state.ship.hull,
        playerCrew: state.crew.roster.length,
        initialPlayerCrew: state.crew.roster.length,
        lostCrewNames: [],
        enemyHull: session.enemy.hull,
        enemyCrew: session.enemy.crew,
        distance,
        subPhase,
        // Convoy hull for escort and merchant defense
        ...(session.type === "escort_defend" || session.type === "distressed_merchant_help"
          ? { convoyHull: Math.floor(window.L.getShipStats(state).maxHull / 2) }
          : {}
        ),
      };
      return battle;
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

    const infamyGain = session && (extraLog.length > 0 || session.type === "navy_patrol") ? 2 : 0;

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

  const applyNavyPatrolSurrender = (state, encounterSession) => {
    const consequence = window.D.SURRENDER_CONSEQUENCE.navy_patrol;
    const activeMission = state.activeMission;
    // Use the centralized contraband info (A8)
    const contrabandInfo = L.getPatrolContrabandInfo(state, consequence.goldFinePct);
    const { hasTobacco, hasSlaves, hasRumSmuggle, seizedValue, fine } = contrabandInfo;

    // Apply standard contraband removal (tobacco, slaves)
    let newHoldItems = L.applyLoseContraband(state.hold?.items || {});
    if (hasRumSmuggle) newHoldItems.rum = 0;

    // Apply 50% cargo loss to non-contraband goods (exclude food/water for safety)
    if (consequence.loseCargoPercent) {
      for (const key in newHoldItems) {
        if (key === "food" || key === "water" || key === "rum" || key === "tobacco" || key === "slaves") continue;
        newHoldItems[key] = Math.floor(newHoldItems[key] * 0.5);
      }
    }

    let s = {
      ...state,
      encounterSession: null,
      gold: Math.max(0, state.gold - fine),
      hold: { ...state.hold, items: newHoldItems },
      crew: { ...state.crew, morale: Math.max(0, state.crew.morale - consequence.moralePenalty) },
      infamy: Math.min(999, (state.infamy ?? 0) + consequence.infamyGain),
      reputation: consequence.rep_loss
        ? L.applyReputationImpact(state, { [encounterSession.enemy.faction]: -consequence.rep_loss })
        : state.reputation,
      screen: L.returnScreen(state),
    };

    // ── Build prose log ──────────────────────────────────────────────
    const logParts = [];
    logParts.push("You surrendered to the patrol");

    if (fine > 0) logParts.push(`you paid a fine of ${fine}g`);
    if (consequence.moralePenalty) logParts.push(`your crew morale took a hit (${consequence.moralePenalty} points)`);
    if (consequence.infamyGain) logParts.push(`+${consequence.infamyGain} infamy`);
    if (consequence.rep_loss) logParts.push(`your reputation with the ${window.D.FACTIONS[encounterSession.enemy.faction]?.label || encounterSession.enemy.faction} suffered (${consequence.rep_loss} points)`);
    if (hasTobacco || hasSlaves || hasRumSmuggle) logParts.push("your illegal goods were confiscated");
    if (consequence.loseCargoPercent) logParts.push(`${consequence.loseCargoPercent}% of your other cargo was seized`);

    let logMessage = logParts.join(". ");
    logMessage = logMessage.replace(/(^|\.\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    if (!logMessage.endsWith(".")) logMessage += ".";

    s.log = [...state.log, window.E.logEntry(s, logMessage)];

    return s;
  };

  // ── Event handlers ──────────────────────────────────────────────────

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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EXPOSE SHARED HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.E.washAshore = washAshore;
  window.E.applyNavyPatrolSurrender = applyNavyPatrolSurrender;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REDUCER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  window.E._reducers.push((state, action) => {
    switch (action.type) {

      // ── INTERCEPT ACTIONS ──────────────────────────────────

      case A.INTERCEPT_FIGHT: {
        if (state.ship.hull === 0) {
          return { ...state, log: [...state.log,
            window.E.logEntry(state, "There is no fighting to be done — the ship is already lost.")] };
        }

        const session = state.encounterSession;
        if (!session || session.phase !== "intercept") return state;

        // Build battle object using the shared helper
        const battle = createBattleState(state, session, { subPhase: "naval", distance: window.L.initialDistanceFor(session.type), openingLog: `You engage the ${session.enemy.name}!` });

        // Tutorial hunt opening shot
        if (state.activeMission?.tutorial && !state.activeMission?.requiredGood) {
          battle.log = ["The Rat fires a hasty shot, grazing your hull!", ...battle.log];
          battle.playerHull = Math.max(0, battle.playerHull - 1);
        }

        const newSession = {
          ...session,
          phase: "battle",
          intercept: null,
          battle: battle,
          plunder: null,
        };

        // Mark that the player refused inspection (relevant for surrender consequences)
        if (session.type === "navy_patrol") {
          newSession.inspectionRefused = true;
        }

        let s = { ...state, encounterSession: newSession, screen: "battle" };
        if (session.type === "navy_patrol") {
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
          if (ctx.type === "navy_patrol") {
            s = L.addHeat(s, ctx.enemy.faction, 2);
          }
          return s;
        }
        // Failed flee → battle
        const battle = createBattleState(state, ctx, { subPhase: "naval", distance: window.L.initialDistanceFor(ctx.type), openingLog: "Escape failed! The enemy closes in." });
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
        // Failed parley → battle
        const battle = createBattleState(state, ctx, { subPhase: "naval", distance: window.L.initialDistanceFor(ctx.type), openingLog: "Your parley failed. They attack!" });
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

        // Navy patrols use the specific heavy consequences
        if (ctx.type === "navy_patrol") {
          return window.E.applyNavyPatrolSurrender(state, ctx);
        }

        const consequence = SURRENDER_CONSEQUENCE[ctx.type] ?? SURRENDER_CONSEQUENCE.random;

        let s = { ...state, encounterSession: null };

        // ── Apply consequences (immutable) ──────────────────────────────────────────────
        const logParts = ["You surrendered."];

        if (consequence.goldFine) {
          s = { ...s, gold: Math.max(0, s.gold - consequence.goldFine) };
          logParts.push(`you paid a fine of ${consequence.goldFine}g`);
        }
        if (consequence.loseGoldPercent) {
          const lost = Math.round(state.gold * (consequence.loseGoldPercent / 100));
          s = { ...s, gold: Math.max(0, s.gold - lost) };
          logParts.push(`you lost ${lost}g (${consequence.loseGoldPercent}% of your gold)`);
        }
        if (consequence.moralePenalty) {
          s = { ...s, crew: { ...s.crew, morale: Math.max(0, s.crew.morale - consequence.moralePenalty) } };
          logParts.push(`your crew morale took a hit (${consequence.moralePenalty} points)`);
        }
        if (consequence.loseDays) {
          s = { ...s, day: s.day + consequence.loseDays };
          logParts.push(`you were imprisoned for ${consequence.loseDays} day${consequence.loseDays !== 1 ? "s" : ""}`);
        }
        if (consequence.rep_loss) {
          const portKey = state.destination ?? state.currentPort;
          s = { ...s, reputation: { ...s.reputation, [portKey]: Math.max(0, (s.reputation[portKey] ?? 20) - consequence.rep_loss) } };
          logParts.push(`your reputation with the local faction suffered (${consequence.rep_loss} points)`);
        }
        if (consequence.loseCargoPercent) {
          const items = s.hold?.items || {};
          s = { ...s, hold: { ...s.hold, items: L.applyLoseCargoPercent(items, consequence.loseCargoPercent) } };
          logParts.push(`${consequence.loseCargoPercent}% of your cargo was seized`);
        }
        if (consequence.loseContraband) {
          const items = s.hold?.items || {};
          s = { ...s, hold: { ...s.hold, items: L.applyLoseContraband(items) } };
          // Also remove rum if it's a smuggle mission
          if (state.activeMission?.type === "smuggle" && state.activeMission?.requiredGood === "rum") {
            s = { ...s, hold: { ...s.hold, items: { ...s.hold.items, rum: 0 } } };
          }
          logParts.push("all illegal goods were confiscated");
        }
        if (consequence.infamyGain) {
          s = { ...s, infamy: Math.min(999, (s.infamy ?? 0) + consequence.infamyGain) };
          logParts.push(`+${consequence.infamyGain} infamy`);
        }

        // ── Mission failure for escort/merchant defense ──────────────────
        if (ctx.type === "escort_defend" && state.activeMission?.type === "escort") {
          const mission = state.activeMission;
          s = { ...s, activeMission: null };
          logParts.push("you abandoned the convoy – the escort mission has failed");
          s = { ...s, reputation: L.applyReputationImpact(s, { [mission.faction]: -5 }) };
        } else if (ctx.type === "distressed_merchant_help") {
          logParts.push("you abandoned the merchant to their fate");
        }

        // ── Build final log message ──────────────────────────────────────
        let logMessage = logParts.join(". ");
        logMessage = logMessage.replace(/(^|\.\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
        if (!logMessage.endsWith(".")) logMessage += ".";

        s = { ...s, log: [...state.log, window.E.logEntry(s, logMessage)] };

        s = { ...s, screen: L.returnScreen(state) };
        return s;
      }

      // --- PATROL INSPECTION ---
      case A.PATROL_INSPECT: {
        const contrabandInfo = L.getPatrolContrabandInfo(state);
        if (!contrabandInfo.hasContraband) {
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

        // ── Store inspection data on session and transition to "inspection_pending" phase ──
        const session = state.encounterSession;
        const newSession = {
          ...session,
          phase: "inspection_pending",
          inspectionContraband: {
            hasTobacco: contrabandInfo.hasTobacco,
            hasSlaves: contrabandInfo.hasSlaves,
            hasRumSmuggle: contrabandInfo.hasRumSmuggle,
            seizedValue: contrabandInfo.seizedValue,
            fine: contrabandInfo.fine,
          },
        };

        return {
          ...state,
          encounterSession: newSession,
          screen: "intercept",
          log: [...state.log, "The patrol found contraband in your hold."],
        };
      }

      case A.RESOLVE_INSPECTION: {
        const session = state.encounterSession;
        if (!session || session.phase !== "inspection_pending") return state;

        const { choice } = action;
        const contraband = session.inspectionContraband;
        const inspectingFaction = PORTS[state.destination ?? state.currentPort]?.faction || null;

        if (choice === "handOver") {
          // ── Hand it over: standard penalties ──
          let newHoldItems = L.applyLoseContraband(state.hold?.items || {});
          if (contraband.hasRumSmuggle) {
            newHoldItems.rum = 0;
          }

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
            gold: Math.max(0, state.gold - contraband.fine),
            hold: { ...state.hold, items: newHoldItems },
            infamy: Math.min(999, (state.infamy ?? 0) + 2),
            reputation: newRep,
            crew: { ...state.crew, morale: Math.max(0, state.crew.morale - 10) },
            screen: L.returnScreen(state),
            log: [
              ...state.log,
              "You hand over the contraband to the patrol.",
              `You had to pay a ${contraband.fine}g fine. The crew's morale drops. +2 infamy.`,
            ],
          };
        } else if (choice === "resist") {
          // ── Guard: can't resist with zero crew ──
          if (state.crew.roster.length === 0) {
            return {
              ...state,
              log: [...state.log, "You have no crew to fight the patrol."],
              encounterSession: { ...session, phase: "intercept" },
            };
          }

          // ── Guard: can't resist with zero hull ──
          if (state.ship.hull === 0) {
            return {
              ...state,
              log: [...state.log, "Your ship is destroyed. You cannot fight."],
              encounterSession: { ...session, phase: "intercept" },
            };
          }

          // ── Build boarding battle ──
          const battle = createBattleState(state, session, { subPhase: "boarding", distance: "close", openingLog: "The patrol seizes your ship! Fight them off!" });

          const newSession = {
            ...session,
            phase: "battle",
            battle: battle,
            intercept: null,
            inspectionRefused: true,
          };

          return {
            ...state,
            encounterSession: newSession,
            screen: "battle",
            log: [...state.log, "You refuse to surrender your cargo. The patrol attacks!"],
          };
        }

        return state;
      }

      // ── EVENTS ──────────────────────────────────────────────

      case A.RESOLVE_EVENT: {
        const event = state.activeEvent;
        if (!event) return state;

        const choice = event.choices[action.choiceIndex];
        const choiceIndex = action.choiceIndex;
        const newState = { ...state, activeEvent: null };

        if (choice.outcome.log) newState.log = [...state.log, choice.outcome.log];
        if (choice.outcome.gold) newState.gold = Math.max(0, state.gold + choice.outcome.gold);

        if (choice.outcome.food) {
          const current = newState.hold?.items?.food ?? 0;
          const newFood = current + choice.outcome.food;
          newState.hold = {
            ...(newState.hold || state.hold || {}),
            items: {
              ...(newState.hold?.items || state.hold?.items || {}),
              food: Math.max(0, newFood)
            }
          };
        }
        if (choice.outcome.water) {
          const current = newState.hold?.items?.water ?? 0;
          const newWater = current + choice.outcome.water;
          newState.hold = {
            ...(newState.hold || state.hold || {}),
            items: {
              ...(newState.hold?.items || state.hold?.items || {}),
              water: Math.max(0, newWater)
            }
          };
        }

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
            if (newHull === 0) {
              // Clear any stale encounterSession to avoid incorrect defeat message
              newState.encounterSession = null;
              return washAshore(newState);
            }
          }
        }
        if (choice.outcome.crewLoss) {
          const roster = state.crew?.roster || [];
          const actualLoss = Math.min(choice.outcome.crewLoss, roster.length);
          if (actualLoss > 0) {
            const result = L.applyCrewLoss(state, actualLoss);
            newState.crew = { ...newState.crew, roster: result.state.crew.roster };
            const names = result.lostNames.join(", ");
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
          const encounterType = choice.outcome.battle.type || event.id;
          const patrolFaction = PORTS[state.destination]?.faction || "english";
          const patrolEnemy = {
            ...choice.outcome.battle.enemy,
            faction: patrolFaction,
            name: `${FACTIONS[patrolFaction]?.label || "Colonial"} Patrol`,
          };
          const context = L.buildEncounterContext(state, encounterType, patrolEnemy);
          const buildEncounterSession = window.E.buildEncounterSession;
          newState.encounterSession = buildEncounterSession(state, context);
          newState.screen = "intercept";
        } else {
          // ── Storm detour: open the map instead of returning to sailing ──
          if (event.id === "storm" && choiceIndex === 1 && state.sailingDaysLeft > 0 && state.route) {
            newState.screen = "map";
            newState.log = [...newState.log, window.E.logEntry(newState, "You decide to seek shelter. Choose a port on the map.")];
          } else {
            newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
          }
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
        const merchantFaction = G.pickMerchantFaction(); // Pick the merchant's faction
        const pirateEnemy = G.generateEnemy("medium", state.fame, "pirate");
        const context = L.buildEncounterContext(state, "distressed_merchant_help", pirateEnemy, { kind: "event", id: "distressed_merchant_help" });
        const encounterSession = buildEncounterSession(state, context);
        // ── Store merchant info for reward handling in DISMISS_BATTLE ──
        encounterSession.merchantFaction = merchantFaction;
        encounterSession.merchantProtected = true;
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
        const context = L.buildEncounterContext(state, "distressed_merchant_plunder", merchantEnemy, { kind: "event", id: "distressed_merchant_plunder" });
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
        let newState = { ...state, activeEvent: null };

        // ── AMBUSH (low probability) ──
        if (roll < 0.08) {  // 8% chance
          const factions = ["english", "spanish", "french", "dutch", "pirate"];
          const ambushFaction = factions[Math.floor(Math.random() * factions.length)];
          const fame = state.fame || 0;
          const enemy = G.generateEnemy("medium", fame, ambushFaction, ambushFaction);
          enemy.name = "Wreck Ambushers";
          const context = L.buildEncounterContext(state, "pirate_ambush", enemy, { kind: "event", id: "drifting_wreck" });
          // Preserve the wreck origin
          const session = window.E.buildEncounterSession(state, context);
          return {
            ...state,
            activeEvent: null,
            encounterSession: session,
            screen: "intercept",
            log: [...state.log, window.E.logEntry(state, "You search the wreck. Ambushers spring from the shadows!")]
          };
        }

        // ── CARGO (50% chance) ──
        if (roll < 0.58) {
          const factions = ["english", "spanish", "french", "dutch"];
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
            window.E.logEntry(state, `You search the wreck. Inside, you find salvageable cargo! +${gold}g.`),
            ...(skipped ? [window.E.logEntry(state, "Your hold is too full to take everything.")] : [])
          ];
          newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
          return newState;
        }

        // ── EMPTY (12% chance) ──
        if (roll < 0.70) {
          newState.log = [...state.log, window.E.logEntry(state, "You search the wreck, but find nothing of value.")];
          newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
          return newState;
        }

        // ── SURVIVOR (30% chance – 0.70 to 1.00) ──
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
            window.E.logEntry(state, `ou search the wreck and find a survivor clinging to the wreckage. ${member.firstName} ${member.lastName}, battered but alive.`)
          ];
        } else {
          newState.crew = { ...state.crew };
          newState.log = [...state.log,
            window.E.logEntry(state, `ou search the wreck and find a survivor clinging to the wreckage, but your ship is already at full capacity. ${member.firstName} ${member.lastName} is left with the wreck.`)
          ];
        }
        newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
        return newState;
      }

      default:
        return state;
    }
  });
})();