// engine_encounter.js – Encounter Setup & Events (Intercept, Events, Merchant Encounters)
// Registers its reducer into window.E._reducers.
// Depends on engine_battle.js for applyCrewLossToState and washAshore.

(() => {
  const { A } = window.E;
  const { PORTS, FACTIONS, SURRENDER_CONSEQUENCE } = window.D;
  const D = window.D;
  const L = window.L;
  const G = window.G;

  // ── Import shared helpers from engine_battle.js ─────────────────────
  const applyCrewLossToState = window.E.applyCrewLossToState;
  const washAshore = window.E.washAshore;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Builds the battle sub‑object from an intercept session.
  // Used by INTERCEPT_FIGHT, INTERCEPT_FLEE (failure), and INTERCEPT_PARLEY (failure).
  const buildBattleFromIntercept = (state, session, openingLog) => ({
    round: 1,
    log: [openingLog],
    playerHull: state.ship.hull,
    playerCrew: state.crew.roster.length,
    initialPlayerCrew: state.crew.roster.length,
    lostCrewNames: [],
    enemyHull: session.enemy.hull,
    enemyCrew: session.enemy.crew,
    distance: window.L.initialDistanceFor(session.type),
    subPhase: "naval",
    ...(session.type === "escort_defend" ? { convoyHull: 50 } : {}),
  });

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
        const battle = buildBattleFromIntercept(state, session, `You engage the ${session.enemy.name}!`);

        // Tutorial hunt opening shot
        let modifiers = session.modifiers || [];
        if (state.activeMission?.tutorial && !state.activeMission?.requiredGood) {
          battle.log = ["The Rat fires a hasty shot, grazing your hull!", ...battle.log];
          battle.playerHull = Math.max(0, battle.playerHull - 1);
          modifiers = [
            ...modifiers,
            { id: "tutorial_warmup", scope: "battle_start", effect: { playerHullDelta: -1 } }
          ];
        }

        const newSession = {
          ...session,
          phase: "battle",
          modifiers: modifiers,
          intercept: null,
          battle: battle,
          plunder: null,
        };

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
        // Failed flee → battle
        const battle = buildBattleFromIntercept(state, ctx, "Escape failed! The enemy closes in.");
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
        const battle = buildBattleFromIntercept(state, ctx, "Your parley failed. They attack!");
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
            if (newHull === 0) {
              return washAshore(newState);
            }
          }
        }
        if (choice.outcome.crewLoss) {
          const roster = state.crew?.roster || [];
          const actualLoss = Math.min(choice.outcome.crewLoss, roster.length);
          if (actualLoss > 0) {
            const result = applyCrewLossToState(state, actualLoss);
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
          const encounterType = event.id === "navy_patrol" ? "navy_patrol_combat" : "patrol";
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