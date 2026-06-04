// engine_combat.js – Combat Domain (Encounters, Battles, Plunder, Events)
// Registers its reducer into window.E._reducers.

(() => {
  const { A } = window.E;
  const { PORTS, FACTIONS, SURRENDER_CONSEQUENCE } = window.D;
  const D = window.D;
  const L = window.L;
  const G = window.G;

  const pickMerchantFaction = () => {
    const factions = Object.keys(FACTIONS).filter(f => f !== "pirate");
    return factions[Math.floor(Math.random() * factions.length)];
  };

  // ── Heat helper ──────────────────────────────────────────────
  const addHeat = (state, faction, amount = 3) => {
    if (faction === "pirate") return state;  // pirates don't track heat
    const alerts = { ...(state.factionAlerts || {}) };
    alerts[faction] = Math.min(10, (alerts[faction] || 0) + amount);
    return { ...state, factionAlerts: alerts };
  };

  // ── Reducer ──────────────────────────────────────────────────
  window.E._reducers.push((state, action) => {
    switch (action.type) {

      // ── INTERCEPT ACTIONS ──────────────────────────────────

      case A.INTERCEPT_FIGHT: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const bs = window.E.createBattleState(state, ctx.enemy, `You engage the ${ctx.enemy.name}!`, ctx.encounterType);

        // Heat for fighting a navy patrol (triggered now, before battle outcome)
        let s = { ...state, encounterContext: null, battleState: bs, screen: "battle" };
        if (ctx.encounterType === "navy_patrol" || ctx.encounterType === "navy_patrol_combat") {
          s = addHeat(s, ctx.enemy.faction, 3);
        }
        return s;
      }

      case A.INTERCEPT_FLEE: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const fleeOpt = ctx.options.find(o => o.id === "flee");
        const { player, enemy } = fleeOpt.speedCheck;
        const playerRoll = player + L.roll(6);
        const enemyRoll  = enemy  + L.roll(6);
        if (playerRoll >= enemyRoll) {
          let s = { ...state, encounterContext: null, screen: L.returnScreen(state), log: [...state.log, "You pulled clear — the enemy couldn't keep up."] };
          // Heat for fleeing a navy patrol
          if (ctx.encounterType === "navy_patrol" || ctx.encounterType === "navy_patrol_combat") {
            s = addHeat(s, ctx.enemy.faction, 2);
          }
          return s;
        }
        const enemyObj = ctx.enemy;
        const bs = window.E.createBattleState(state, enemyObj, "Escape failed! The enemy closes in.", ctx.encounterType);
        return { ...state, encounterContext: null, battleState: bs, screen: "battle", log: [...state.log, "Failed to escape — battle unavoidable."] };
      }

      case A.INTERCEPT_PARLEY: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const rep = state.reputation[state.destination ?? state.currentPort] ?? 20;
        const success = L.roll(100) <= Math.min(80, rep + 20);
        if (success) {
          const portKey = state.destination ?? state.currentPort;
          return { ...state, encounterContext: null, screen: L.returnScreen(state), reputation: { ...state.reputation, [portKey]: Math.min(100, (state.reputation[portKey] ?? 20) + 3) }, log: [...state.log, "Parley successful. They let you pass."] };
        }
        const enemyObj = ctx.enemy;
        const bs = window.E.createBattleState(state, enemyObj, "Parley failed — they attack!", ctx.encounterType);
        return { ...state, encounterContext: null, battleState: bs, screen: "battle", log: [...state.log, "Parley failed. Battle unavoidable."] };
      }

      case A.INTERCEPT_BRIBE: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const bribeOpt = ctx.options.find(o => o.id === "bribe");
        const cost = bribeOpt.cost;
        const portKey = state.destination ?? state.currentPort;
        return { ...state, encounterContext: null, gold: state.gold - cost, reputation: { ...state.reputation, [portKey]: Math.max(0, (state.reputation[portKey] ?? 20) - 2) }, screen: L.returnScreen(state), log: [...state.log, `Bribed them with ${cost}g. They looked the other way.`] };
      }

      case A.INTERCEPT_SURRENDER: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const consequence = SURRENDER_CONSEQUENCE[ctx.type] ?? SURRENDER_CONSEQUENCE.random;

        let s = { ...state, encounterContext: null };

        if (consequence.goldFine) s.gold = Math.max(0, s.gold - consequence.goldFine);
        if (consequence.loseGoldPercent) s.gold = Math.max(0, Math.round(s.gold * (1 - consequence.loseGoldPercent / 100)));
        if (consequence.moralePenalty) s.crew = { ...s.crew, morale: Math.max(0, s.crew.morale - consequence.moralePenalty) };
        if (consequence.loseDays) { s.day += consequence.loseDays; }
        if (consequence.rep_loss) {
          const portKey = state.destination ?? state.currentPort;
          s.reputation = { ...s.reputation, [portKey]: Math.max(0, (s.reputation[portKey] ?? 20) - consequence.rep_loss) };
        }

        let newHoldItems = { ...(state.hold?.items || {}) };
        const logExtra = [];
        if (consequence.loseCargoPercent) {
          newHoldItems = L.applyLoseCargoPercent(newHoldItems, consequence.loseCargoPercent);
          logExtra.push(`${consequence.loseCargoPercent}% of your cargo was seized.`);
        }
        if (consequence.loseContraband) {
          newHoldItems = L.applyLoseContraband(newHoldItems);
          logExtra.push("Your contraband was confiscated.");
        }

        s.hold = { ...state.hold, items: newHoldItems };
        s.screen = L.returnScreen(state);
        s.log = [...state.log, "You surrendered. The consequences were steep.", ...logExtra];

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
            encounterContext: null,
            screen: L.returnScreen(state),
            log: [...state.log, "The patrol found nothing. You are waved through."],
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
          encounterContext: null,
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
            "+2 infamy — your name is in their ledger now.",
            "The crew's morale drops.",
          ],
        };
      }

      // ── COMBAT ──────────────────────────────────────────────

      case A.BATTLE_ACTION: {
        const outcome = L.resolveCombatAction(state, action.action);
        const newLog = [...state.battleState.log];
        let newMorale = Math.max(0, Math.min(100, state.crew.morale + (outcome.moraleDelta || 0)));

        if (outcome.instantVictory) {
          const newRep = L.applyReputationImpact(state, { [state.battleState.enemy.faction]: -5 });
          const initialCrew = state.battleState.initialCrewCount ?? state.crew.roster.length;
          const lostCrewNames = state.battleState.lostCrewNames ?? [];
          const totalLost = initialCrew - state.crew.roster.length;
          let capMsg = "Victory! Boarding successful.";
          if (totalLost > 0) {
            const some = lostCrewNames.slice(0, 3).join(", ");
            capMsg += ` Lost ${totalLost} crew, including ${some}.`;
          }
          const enemyFaction = state.battleState.enemy.faction;
          const alignmentPenalty = Math.round(3 * L.getAlignmentModifier(state, enemyFaction));
          newMorale = Math.max(0, newMorale - alignmentPenalty);
          if (alignmentPenalty > 3) {
            capMsg += ` Your ${enemyFaction}-majority crew is furious about this.`;
          }

          const newBS = {
            ...state.battleState,
            phase: "victory",
            goldReward: outcome.goldReward || 0,
            enemyCargo: outcome.enemyCargo || {},
            canPlunder: true,
            log: [...newLog, `Player: ${action.action}. Boarding successful!`]
          };

          return {
            ...state,
            reputation: newRep,
            ship: { ...state.ship, hull: state.battleState.playerHull },
            crew: { ...state.crew, morale: newMorale },
            battleState: newBS,
            log: [...state.log, capMsg]
          };
        }

        const newPlayerCrewCount = Math.max(0, state.battleState.playerCrew - outcome.enemy.crewLoss);
        const lostCount = state.crew.roster.length - newPlayerCrewCount;
        let newRoster = state.crew.roster;
        let crewLog = "";
        if (lostCount > 0) {
          const { newRoster: nr, removed } = L.removeRandomCrew(state.crew.roster, lostCount);
          newRoster = nr;
          const lostCrewNames = [...state.battleState.lostCrewNames, ...removed.map(m => `${m.firstName} ${m.lastName}`)];
          state.battleState.lostCrewNames = lostCrewNames;
          const names = removed.map(m => `${m.firstName} ${m.lastName}`).join(", ");
          crewLog = ` Lost ${lostCount} crew: ${names}.`;
        }

        const newBattleState = {
          ...state.battleState,
          playerHull: Math.max(0, state.battleState.playerHull - outcome.enemy.hullDamage),
          enemyHull: Math.max(0, state.battleState.enemyHull - outcome.player.hullDamage),
          playerCrew: newRoster.length,
          enemyCrew: Math.max(0, state.battleState.enemyCrew - outcome.player.crewLoss),
          round: state.battleState.round + 1,
          phase: "npc_turn",
          log: [...newLog, `Player: ${action.action}. Enemy: ${L.getNPCAction(state.battleState.enemy)}.${crewLog}`],
          lostCrewNames: state.battleState.lostCrewNames ?? [],
        };

        // Escort defend: automatic convoy damage
        if (newBattleState.encounterType === "escort_defend" && newBattleState.convoyHull > 0) {
          const convoyDmg = Math.ceil((state.battleState.enemy.cannons || 10) * 0.5);
          newBattleState.convoyHull = Math.max(0, newBattleState.convoyHull - convoyDmg);
          newBattleState.log.push(`The convoy takes ${convoyDmg} hull damage.`);

          if (newBattleState.convoyHull <= 0) {
            newBattleState.phase = "defeat";
            newBattleState.log.push("The convoy ship has been destroyed!");
            return {
              ...state,
              ship: { ...state.ship, hull: newBattleState.playerHull },
              crew: { ...state.crew, roster: newRoster, morale: newMorale },
              battleState: newBattleState,
              log: [...state.log, "The convoy was lost. Mission failed."]
            };
          }
        }

        // sink victory
        if (newBattleState.enemyHull <= 0) {
          newBattleState.phase = "victory";
          newBattleState.goldReward = outcome.goldReward || 0;
          const initialCrew = newBattleState.initialCrewCount ?? state.crew.roster.length;
          const lostCrewNames = newBattleState.lostCrewNames ?? [];
          const totalLost = initialCrew - newRoster.length;
          let capMsg = "Victory! The enemy ship was sunk.";
          if (totalLost > 0) {
            const some = lostCrewNames.slice(0, 3).join(", ");
            capMsg += ` Lost ${totalLost} crew, including ${some}.`;
          }
          const enemyFaction = state.battleState.enemy.faction;
          const alignmentPenalty = Math.round(3 * L.getAlignmentModifier(state, enemyFaction));
          newMorale = Math.max(0, newMorale - alignmentPenalty);
          if (alignmentPenalty > 3) {
            capMsg += ` Your ${enemyFaction}-majority crew is furious about this.`;
          }
          const newRep = L.applyReputationImpact(state, { [state.battleState.enemy.faction]: -5 });
          return {
            ...state,
            gold: state.gold + (outcome.goldReward || 0),
            reputation: newRep,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, roster: newRoster, morale: newMorale },
            battleState: newBattleState,
            log: [...state.log, capMsg]
          };
        }

        if (newBattleState.playerHull <= 0) {
          newBattleState.phase = "defeat";
          const initialCrew = newBattleState.initialCrewCount ?? state.crew.roster.length;
          const lostCrewNames = newBattleState.lostCrewNames ?? [];
          const totalLost = initialCrew - newRoster.length;
          let capMsg = "Defeated! Your ship was destroyed.";
          if (totalLost > 0) {
            const some = lostCrewNames.slice(0, 3).join(", ");
            capMsg += ` Lost ${totalLost} crew, including ${some}.`;
          }
          newBattleState.log.push("Your ship is destroyed!");
          return {
            ...state,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, roster: newRoster, morale: newMorale },
            battleState: newBattleState,
            log: [...state.log, capMsg]
          };
        }

        if (outcome.fled) {
          newBattleState.phase = "fled";
          return {
            ...state,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, roster: newRoster, morale: newMorale },
            battleState: newBattleState
          };
        }

        return {
          ...state,
          ship: { ...state.ship, hull: newBattleState.playerHull },
          crew: { ...state.crew, roster: newRoster, morale: newMorale },
          battleState: newBattleState
        };
      }

      case A.DISMISS_BATTLE: {
        const { battleState } = state;
        let currentState = state;

        const isNavyFight = battleState.encounterType === "navy_patrol"
                        || battleState.encounterType === "navy_patrol_combat";
        const patrolInfamy = isNavyFight ? 2 : 0;
        const patrolLog = patrolInfamy > 0
          ? [`+${patrolInfamy} infamy — attacking crown forces was witnessed.`]
          : [];

        if (battleState.phase === "defeat") {
          const returnPort = state.previousPort || state.currentPort;
          const portName = PORTS[returnPort]?.name || "a nearby port";
          const isMissionFight = battleState.encounterType === "mission_combat"
                              || battleState.encounterType === "escort_defend";
          const missionFailed = isMissionFight && state.activeMission;

          return {
            ...currentState,
            battleState: null,
            activeMission: missionFailed ? null : currentState.activeMission,
            screen: "port",
            currentPort: returnPort,
            destination: null,
            sailingDaysLeft: 0,
            sailingDaysTotal: 0,
            hold: {
              ...currentState.hold,
              items: Object.fromEntries(Object.keys(currentState.hold?.items || {}).map(k => [k, 0])),
            },
            portMarket: G.generatePortMarket(returnPort),
            missions: G.generateMissions(returnPort, currentState),
            infamy: Math.min(999, (currentState.infamy ?? 0) + patrolInfamy),
            log: [
              ...currentState.log,
              `Defeated in battle and washed ashore at ${portName}.`,
              "All cargo lost.",
              ...(missionFailed ? ["The mission has failed."] : []),
              ...patrolLog,
            ],
          };
        }

        if (battleState.canPlunder && battleState.phase === "victory") {
          return addHeat(
            {
              ...currentState,
              battleState: { ...currentState.battleState, phase: "victory" },
              screen: "plunder",
            },
            battleState.enemy.faction,
            3
          );
        }

        // ── Crew upset: 15% chance per matching-faction crew member ──
        if (battleState.phase === "victory" && currentState.crew?.roster) {
          const enemyFaction = battleState.enemy?.faction;
          if (enemyFaction) {
            const upsetMembers = [];
            const updatedRoster = currentState.crew.roster.map(member => {
              if (member.faction === enemyFaction && !L.hasTag(member, "upset") && !L.hasTag(member, "loyal") && Math.random() < 0.15) {
                upsetMembers.push(`${member.firstName} ${member.lastName}`);
                return L.addTag(member, "upset");
              }
              return member;
            });

            if (upsetMembers.length > 0) {
              const newLog = [...currentState.log];
              if (upsetMembers.length === 1) {
                newLog.push(`${upsetMembers[0]} is disturbed by the attack on ${FACTIONS[enemyFaction]?.label || enemyFaction} ships.`);
              } else if (upsetMembers.length === 2) {
                newLog.push(`${upsetMembers[0]} and ${upsetMembers[1]} are disturbed by the attack on ${FACTIONS[enemyFaction]?.label || enemyFaction} ships.`);
              } else {
                newLog.push(`Some of the crew are disturbed by the attack on ${FACTIONS[enemyFaction]?.label || enemyFaction} ships.`);
              }
              currentState = {
                ...currentState,
                crew: { ...currentState.crew, roster: updatedRoster },
                log: newLog,
              };
            }
          }
        }

        // ── Battle scar: heavy casualties ──────────────────────────
        if (battleState.phase === "victory" && currentState.crew?.roster) {
          const initialCrew = battleState.initialCrewCount ?? currentState.crew.roster.length;
          const lostCount = initialCrew - currentState.crew.roster.length;
          if (lostCount >= 10) {
            const scarredRoster = currentState.crew.roster.map(member => {
              if (!L.hasTag(member, "scar_battle")) {
                return L.addTag(member, "scar_battle");
              }
              return member;
            });
            currentState = {
              ...currentState,
              crew: { ...currentState.crew, roster: scarredRoster },
            };
          }
        }

        if (battleState.encounterType === "mission_combat" && battleState.phase === "victory") {
          const missionType = currentState.activeMission?.type;
          if (missionType === "patrol" && currentState.activeMission) {
            return addHeat(
              {
                ...currentState,
                battleState: null,
                activeMission: { ...currentState.activeMission, enemyDefeated: true },
                screen: battleState.returnScreen === "sailing" ? "sailing" : "port",
                log: [...currentState.log, "The patrol zone is clear."],
              },
              battleState.enemy.faction,
              3
            );
          }
        }

        if (battleState.phase === "fled") {
          const isMissionFight = battleState.encounterType === "mission_combat"
                              || battleState.encounterType === "escort_defend";
          if (isMissionFight) {
            const returnToSailing = currentState.destination && currentState.sailingDaysLeft > 0;
            return {
              ...currentState,
              battleState: null,
              activeMission: null,
              screen: returnToSailing ? "sailing" : "port",
              log: [...currentState.log, "You fled the battle. The mission is a failure."],
            };
          }
        }

        if (battleState.returnScreen === "sailing" && currentState.destination && currentState.sailingDaysLeft > 0) {
          return addHeat(
            {
              ...currentState,
              battleState: null,
              screen: "sailing",
              infamy: Math.min(999, (currentState.infamy ?? 0) + patrolInfamy),
              log: [...currentState.log, ...patrolLog],
            },
            battleState.enemy.faction,
            3
          );
        }

        return addHeat(
          {
            ...currentState,
            battleState: null,
            screen: battleState.returnScreen || "port",
            infamy: Math.min(999, (currentState.infamy ?? 0) + patrolInfamy),
            log: [...currentState.log, ...patrolLog],
          },
          battleState.enemy.faction,
          3
        );
      }

      case A.TAKE_PLUNDER: {
        const bs = state.battleState;
        if (!bs || !bs.canPlunder) return state;

        const goldReward = bs.goldReward || 0;
        const finalHoldItems = action.holdItems;

        const newGold = state.gold + goldReward;
        const logLines = [`Plundered the ${bs.enemy.name}. +${goldReward}g.`];

        return {
          ...state,
          gold: newGold,
          hold: { ...state.hold, items: finalHoldItems },
          battleState: null,
          screen: bs.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0
            ? "sailing" : "port",
          log: [...state.log, ...logLines],
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
        
        // ── Mutiny outcomes (negotiate + crush) ──────────────────────────
        if (event.id === "mutiny") {
          const roster = state.crew?.roster || [];
          if (action.choiceIndex === 0) {
            // Negotiate
            const mutinyCost = roster.length * 10;
            if (state.gold >= mutinyCost) {
              newState.gold = Math.max(0, (newState.gold || state.gold) - mutinyCost);
              newState.crew = {
                ...(newState.crew || state.crew),
                morale: Math.min(100, (newState.crew?.morale || state.crew.morale) + 20)
              };
              newState.log = [...(newState.log || state.log),
                `You promise better conditions, costing ${mutinyCost}g. The crew stands down… for now.`
              ];
            } else {
              // Can't afford — negotiation fails, some crew become upset
              const upsetCount = Math.ceil(roster.length * 0.30);
              const shuffled = [...roster].sort(() => Math.random() - 0.5);
              const upsetNames = [];
              const updatedRoster = roster.map(member => {
                if (shuffled.indexOf(member) < upsetCount) {
                  upsetNames.push(member.firstName);
                  return L.addTag(member, "upset");
                }
                return member;
              });
              newState.crew = {
                ...(newState.crew || state.crew),
                roster: updatedRoster,
                morale: Math.max(0, (newState.crew?.morale || state.crew.morale) - 5)
              };
              const nameList = upsetNames.length === 1
                ? upsetNames[0]
                : upsetNames.length === 2
                  ? `${upsetNames[0]} and ${upsetNames[1]}`
                  : "Several crew members";
              newState.log = [...(newState.log || state.log),
                `You promise better conditions, but the crew sees through your empty words. ${nameList} ${upsetNames.length === 1 ? 'is' : 'are'} now upset.`
              ];
            }
          } else if (action.choiceIndex === 1) {
            // Crush — after generic crew loss & morale penalty have been applied
            const survivors = newState.crew?.roster || roster;
            const mutineerCount = Math.ceil(survivors.length * 0.30);
            if (mutineerCount > 0) {
              const shuffled = [...survivors].sort(() => Math.random() - 0.5);
              const tagged = [];
              const updatedRoster = survivors.map(member => {
                if (shuffled.indexOf(member) < mutineerCount) {
                  tagged.push(member.firstName);
                  return L.addTag(member, "mutineer");
                }
                return member;
              });
              newState.crew = { ...(newState.crew || state.crew), roster: updatedRoster };
              const names = tagged.length === 1
                ? tagged[0]
                : tagged.length === 2
                  ? `${tagged[0]} and ${tagged[1]}`
                  : "Several survivors";
              newState.log = [...(newState.log || state.log),
                `${names} emerged as ringleaders. They are marked as mutineers.`
              ];
            }
          }
        }

        if (choice.outcome.fame) newState.fame += choice.outcome.fame;
        if (choice.outcome.hullDamage) newState.ship = { ...state.ship, hull: Math.max(0, state.ship.hull - choice.outcome.hullDamage) };
        if (choice.outcome.crewLoss) {
          const lost = choice.outcome.crewLoss;
          const { newRoster, removed } = L.removeRandomCrew(state.crew.roster, lost);
          newState.crew = { ...state.crew, roster: newRoster };
          const names = removed.map(m => `${m.firstName} ${m.lastName}`).join(", ");
          newState.log = [...(newState.log || state.log), `Lost ${lost} crew: ${names}.`];
        }
        if (choice.outcome.loseCargoPercent) {
          const newHoldItems = L.applyLoseCargoPercent(state.hold?.items || {}, choice.outcome.loseCargoPercent);
          newState.hold = { ...state.hold, items: newHoldItems };
          newState.log = [...(newState.log || state.log), `${choice.outcome.loseCargoPercent}% of your cargo was lost.`];
        }
        if (choice.outcome.daysLost) {
          const lost = choice.outcome.daysLost;
          newState.day += lost;
          newState.sailingDaysTotal = (state.sailingDaysTotal || 0) + lost;
          newState.sailingDaysLeft = (state.sailingDaysLeft || 0) + lost;
          newState.gold = Math.max(0, newState.gold - L.payCrewWages(state) * lost);
          let rep = { ...state.reputation };
          for (let i = 0; i < lost; i++) rep = L.decayReputation({ reputation: rep });
          newState.reputation = rep;
        }
        if (choice.outcome.repImpact) newState.reputation = L.applyReputationImpact(state, choice.outcome.repImpact);
        // ── Storm scar: all survivors tagged ───────────────────────
        if (event.id === "storm") {
          const scarredRoster = (newState.crew?.roster || state.crew.roster).map(member => {
            if (!L.hasTag(member, "scar_storm")) {
              return L.addTag(member, "scar_storm");
            }
            return member;
          });
          newState.crew = { ...(newState.crew || state.crew), roster: scarredRoster };
        }
        if (choice.outcome.moraleBonus) newState.crew = { ...newState.crew, morale: Math.max(0, Math.min(100, (newState.crew.morale || state.crew.morale) + choice.outcome.moraleBonus)) };

        if (choice.outcome.battle) {
          const encounterType = event.id === "navy_patrol" ? "navy_patrol_combat" : "patrol";
          const patrolFaction = PORTS[state.destination]?.faction || "english";
          const patrolEnemy = {
            ...choice.outcome.battle.enemy,
            faction: patrolFaction,
            name: `${FACTIONS[patrolFaction]?.label || "Colonial"} Patrol`,
          };
          newState.encounterContext = L.buildEncounterContext(state, encounterType, patrolEnemy);
          newState.screen = "intercept";
        } else {
          newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
        }

        if (choice.outcome.mapFragment) {
          const fragment = choice.outcome.mapFragment;
          const alreadyHave = (newState.mapFragments || state.mapFragments).includes(fragment);
          if (!alreadyHave) {
            newState.mapFragments = [...(newState.mapFragments || state.mapFragments), fragment];
            Object.entries(PORTS).forEach(([portKey, port]) => {
              if (!port.hidden) return;
              if ((newState.discoveredPorts || []).includes(portKey)) return;
              const cond = port.unlockCondition?.conditions || [];
              const itemCond = cond.find(c => c.type === "item" && c.value === fragment);
              if (itemCond) {
                newState.discoveredPorts = [...(newState.discoveredPorts || []), portKey];
                newState.log = [...(newState.log || []), `⚓ New port discovered: ${port.name}. The chart reveals everything.`];
              }
            });
          }
        }

        // ── outcome.generateCargo ──────────────────────────────────
        if (choice.outcome.generateCargo) {
          const { risk, faction } = choice.outcome.generateCargo;
          const fakeEnemy = { faction: faction || "english", hull: 50, cannons: 4, crew: 10 };
          const { gold: plunderGold, cargo } = G.generateEnemyCargo(state, fakeEnemy, risk || "low");

          newState.gold = (newState.gold || state.gold) + plunderGold;

          const items = { ...(newState.hold?.items || state.hold?.items || {}) };
          const capacity = L.getHoldCapacity(state);
          let used = L.getHoldUsed(items);
          let anySkipped = false;

          Object.entries(cargo).forEach(([good, qty]) => {
            const canFit = Math.max(0, capacity - used);
            const added = Math.min(qty, canFit);
            if (added > 0) { items[good] = (items[good] || 0) + added; used += added; }
            if (added < qty) anySkipped = true;
          });

          newState.hold = { ...(newState.hold || state.hold), items };
          if (anySkipped) {
            newState.log = [...(newState.log || state.log), "Your hold is too full to take everything."];
          }
        }

        // ── outcome.addCrew ───────────────────────────────────────
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
          newState.crew = { ...state.crew, roster: [...state.crew.roster, ...newMembers] };
          newState.log = [...(newState.log || state.log),
            `${newMembers.length === 1 ? names + " joins" : names + " join"} your crew.`];
        }

        if (choice.outcome.action) {
          if (choice.outcome.log && !newState.log.includes(choice.outcome.log)) {
            newState.log = [...newState.log, choice.outcome.log];
          }
          return window.E.reducer(
            { ...newState, activeEvent: null },
            { type: choice.outcome.action }
          );
        }

        return newState;
      }

      // --- Merchant Encounters ---
      case A.ATTACK_PIRATE: {
        const pirateEnemy = G.generateEnemy("medium", state.fame, "pirate");
        const encounterContext = L.buildEncounterContext(state, "distressed_merchant_help", pirateEnemy);
        return {
          ...state,
          encounterContext,
          screen: "intercept",
          log: [...state.log, "You rush to the merchant's aid."]
        };
      }

      case A.ATTACK_MERCHANT: {
        const faction = pickMerchantFaction();
        const currentTier = L.getFameInfo(state.fame).tier;
        const lowerTier = Math.max(0, currentTier - 1);
        const lowerFame = lowerTier === 0 ? 0 : lowerTier * 50;
        const merchantEnemy = G.generateEnemy("low", lowerFame, faction);
        merchantEnemy.name = "Merchant Vessel";
        const encounterContext = L.buildEncounterContext(state, "distressed_merchant_plunder", merchantEnemy);

        // Heat for attacking a merchant
        return addHeat(
          {
            ...state,
            encounterContext,
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
          newState.crew = { ...state.crew, roster: [...state.crew.roster, member] };
          newState.log = [...state.log,
            `You find a survivor clinging to the wreckage — ${member.firstName} ${member.lastName}, battered but alive.`
          ];

        } else {
          const enemy = G.generateEnemy("low", state.fame, "pirate");
          enemy.name = "Wreck Looters";
          const ctx = L.buildEncounterContext(state, "random", enemy);
          newState.encounterContext = ctx;
          newState.screen = "intercept";
          newState.log = [...state.log, "As you board the wreck, pirates emerge from the hold — it was a trap!"];
        }

        return newState;
      }

      default:
        return state;
    }
  });
})();