// logic_combat_encounter.js — Combat resolution (old + B11) and encounter building.
// Depends on logic_core.js and logic_economy_crew.js (must be loaded after).
// Exposed as window.L.

window.L = window.L || {};

(() => {
  const { SHIPS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE } = window.D;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  COMBAT HELPERS (old)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // const emptyOutcome = () => ({
  //   player: { hullDamage: 0, crewLoss: 0 },
  //   enemy: { hullDamage: 0, crewLoss: 0 },
  //   moraleDelta: 0,
  //   fled: false,
  //   instantVictory: false,
  //   goldReward: 0,
  //   enemyCargo: {},
  // });

  // const getNPCAction = (enemy) => {
  //   const roll = Math.random();
  //   if (roll < 0.7) return "broadside";
  //   if (roll < 0.95) return "precision";
  //   return "grapple";
  // };

  // const maybeCrewLoss = (amount) => Math.random() < 0.5 ? 0 : Math.floor(amount);

  // const resolvePlayerAction = (state, action, battleState, enemy) => {
  //   const shipStats = window.L.getShipStats(state);
  //   const out = emptyOutcome();
  //   switch (action) {
  //     case "broadside": {
  //       const dmg = shipStats.cannons * (0.8 + Math.random() * 0.4);
  //       const hullMod = 1 + (window.L.getEquipmentEffect(state, "hullDmgPct") || 0);
  //       const crewMod = 1 + (window.L.getEquipmentEffect(state, "crewDmgPct") || 0);
  //       out.player.hullDamage = Math.max(1, Math.floor(dmg * 0.6 * hullMod));
  //       out.player.crewLoss = maybeCrewLoss(dmg * 0.4 / 3 * crewMod);
  //       break;
  //     }
  //     case "precision": {
  //       const precisionBaseChance = 0.7 + (window.L.getEquipmentEffect(state, "precisionHitPct") || 0);
  //       if (Math.random() < precisionBaseChance) {
  //         const dmg = shipStats.cannons * (1.2 + Math.random() * 0.6);
  //         const hullMod = 1 + (window.L.getEquipmentEffect(state, "hullDmgPct") || 0);
  //         const crewMod = 1 + (window.L.getEquipmentEffect(state, "crewDmgPct") || 0);
  //         out.player.hullDamage = Math.floor(dmg * 0.9 * hullMod);
  //         out.player.crewLoss = maybeCrewLoss(dmg * 0.1 / 3 * crewMod);
  //       }
  //       break;
  //     }
  //     case "grapple": {
  //       const playerCrew = state.crew.roster.length;
  //       const enemyCrew = enemy.crew;
  //       const playerHullPct = state.ship.hull / shipStats.maxHull;
  //       const playerMoralePct = state.crew.morale / 100;
  //       let successChance = 0.5;
  //       successChance += Math.min(0.3, Math.max(0, (playerCrew - enemyCrew) / enemyCrew * 0.3));
  //       successChance += Math.min(0.2, Math.max(0, (playerMoralePct - 0.5) * 0.4));
  //       successChance += Math.min(0.2, Math.max(0, (playerHullPct - 0.5) * 0.4));
  //       successChance = Math.min(0.95, successChance);
  //       if (Math.random() < successChance) {
  //         out.instantVictory = true;
  //         const ratio = playerCrew / (playerCrew + enemyCrew);
  //         let loss = Math.ceil(playerCrew * (0.05 + 0.25 * (1 - ratio)));
  //         if (playerCrew < 5) loss = 0;
  //         out.enemy.crewLoss = loss;
  //         out.plunderRisk = state.activeMission?.risk || "medium";
  //       } else {
  //         const crewLossPct = 0.3 + Math.random() * 0.2;
  //         out.enemy.crewLoss = Math.floor(playerCrew * crewLossPct);
  //       }
  //       break;
  //     }
  //     case "evade": {
  //       const enemyShipType = window.L.guessShipType(enemy);
  //       const enemySpeed = SHIPS[enemyShipType]?.speed ?? 10;
  //       const speedBonus = Math.min(0.3, Math.max(-0.3, (shipStats.speed - enemySpeed) * 0.02));
  //       const fleeChance = Math.min(0.95, Math.max(0.20, 0.6 + speedBonus));
  //       if (Math.random() < fleeChance) {
  //         out.fled = true;
  //       } else {
  //         const enemyDmg = enemy.cannons * (0.8 + Math.random() * 0.4);
  //         out.player.hullDamage = Math.floor(enemyDmg * 0.3);
  //         out.player.crewLoss = maybeCrewLoss(enemyDmg * 0.2 / 3);
  //       }
  //       break;
  //     }
  //   }
  //   return out;
  // };

  // const applyMoraleModifier = (state, action, playerOutcome, battleState, enemy) => {
  //   let delta = 0;
  //   if (playerOutcome.instantVictory) delta = 5;
  //   else if (playerOutcome.fled) delta = -5;
  //   else {
  //     const newEnemyHull = Math.max(0, battleState.enemyHull - playerOutcome.player.hullDamage);
  //     if (newEnemyHull <= 0) delta = 5;
  //     else if (action === "grapple") delta = -10;
  //   }
  //   return { moraleDelta: delta };
  // };

  // const resolveNpcAction = (state, battleState, enemy) => {
  //   const npcAction = getNPCAction(enemy);
  //   const npcDmg = enemy.cannons * (0.7 + Math.random() * 0.3);
  //   const result = {
  //     enemy: { hullDamage: 0, crewLoss: 0 },
  //     player: { hullDamage: 0, crewLoss: 0 },
  //     action: npcAction,
  //     hit: false,
  //     grappleSuccess: false,
  //   };
  //   switch (npcAction) {
  //     case "broadside": {
  //       result.enemy.hullDamage = Math.floor(npcDmg * 0.6);
  //       result.enemy.crewLoss = maybeCrewLoss(npcDmg * 0.4 / 3);
  //       break;
  //     }
  //     case "precision": {
  //       const npcHit = Math.random() < 0.7;
  //       result.hit = npcHit;
  //       if (npcHit) {
  //         result.enemy.hullDamage = Math.floor(npcDmg * 0.9);
  //         result.enemy.crewLoss = maybeCrewLoss(npcDmg * 0.1 / 3);
  //       }
  //       break;
  //     }
  //     case "grapple": {
  //       const enemyCrew = enemy.crew;
  //       const playerCrew = state.crew.roster.length;
  //       const enemyHullPct = battleState.enemyHull / enemy.hull;
  //       let npcSuccessChance = 0.5;
  //       npcSuccessChance += Math.min(0.3, Math.max(0, (enemyCrew - playerCrew) / playerCrew * 0.3));
  //       npcSuccessChance += Math.min(0.2, Math.max(0, (enemyHullPct - 0.5) * 0.4));
  //       npcSuccessChance += 0.1;
  //       npcSuccessChance = Math.min(0.95, npcSuccessChance);
  //       const npcSuccess = Math.random() < npcSuccessChance;
  //       result.grappleSuccess = npcSuccess;
  //       if (npcSuccess) {
  //         result.enemy.crewLoss += Math.floor(playerCrew * (0.3 + Math.random() * 0.2));
  //       } else {
  //         const ratio = enemyCrew / (enemyCrew + playerCrew);
  //         let loss = Math.ceil(enemyCrew * (0.05 + 0.25 * (1 - ratio)));
  //         if (enemyCrew < 5) loss = 0;
  //         result.player.crewLoss += loss;
  //       }
  //       break;
  //     }
  //   }
  //   return result;
  // };

  // const applyDamageMoralePenalty = (state, outcome, battleState) => {
  //   const effectiveMorale = window.L.getEffectiveMorale(state);
  //   const modifier = effectiveMorale < 30 ? 1.2 : (effectiveMorale > 70 ? 0.9 : 1);
  //   const wasHit = outcome.player.hullDamage > 0;
  //   outcome.player.hullDamage = Math.floor(outcome.player.hullDamage * modifier);
  //   if (wasHit && outcome.player.hullDamage === 0) outcome.player.hullDamage = 1;
  //   outcome.player.crewLoss = Math.floor(outcome.player.crewLoss * modifier);
  //   return outcome;
  // };

  // const combineCombatOutcomes = (playerOut, morale, npcOut) => {
  //   const final = emptyOutcome();
  //   final.player.hullDamage = playerOut.player.hullDamage;
  //   final.player.crewLoss = playerOut.player.crewLoss;
  //   final.enemy.hullDamage = playerOut.enemy.hullDamage;
  //   final.enemy.crewLoss = playerOut.enemy.crewLoss;
  //   final.fled = playerOut.fled;
  //   final.instantVictory = playerOut.instantVictory;
  //   final.goldReward = playerOut.goldReward;
  //   final.enemyCargo = playerOut.enemyCargo || {};
  //   final.moraleDelta = morale.moraleDelta;
  //   if (npcOut) {
  //     final.enemy.hullDamage += npcOut.enemy.hullDamage;
  //     final.enemy.crewLoss += npcOut.enemy.crewLoss;
  //     final.player.hullDamage += npcOut.player.hullDamage;
  //     final.player.crewLoss += npcOut.player.crewLoss;
  //   }
  //   return final;
  // };

  // const resolveCombatAction = (state, action, battleState, enemy) => {
  //   if (!battleState || !enemy) return emptyOutcome();
  //   const playerOutcome = resolvePlayerAction(state, action, battleState, enemy);
  //   let playerHit = null, playerGrappleSuccess = null;
  //   if (action === "precision") playerHit = playerOutcome.player.hullDamage > 0;
  //   else if (action === "grapple") playerGrappleSuccess = playerOutcome.instantVictory;
  //   const moraleOutcome = applyMoraleModifier(state, action, playerOutcome, battleState, enemy);
  //   let npcOutcome = null;
  //   if (!playerOutcome.fled && !playerOutcome.instantVictory) {
  //     npcOutcome = resolveNpcAction(state, battleState, enemy);
  //   }
  //   const combined = combineCombatOutcomes(playerOutcome, moraleOutcome, npcOutcome);
  //   combined.playerCrewLossFromPlayerAction = playerOutcome.enemy.crewLoss;
  //   combined.playerCrewLossFromNpcAction = npcOutcome ? npcOutcome.enemy.crewLoss : 0;
  //   combined.enemyCrewLossFromPlayerAction = playerOutcome.player.crewLoss;
  //   combined.enemyCrewLossFromNpcAction = npcOutcome ? npcOutcome.player.crewLoss : 0;
  //   combined.playerHullDamageOutput = playerOutcome.player.hullDamage;
  //   combined.npcHullDamageOutput = npcOutcome ? npcOutcome.enemy.hullDamage : 0;
  //   const crewLossMult = window.L.getEquipmentEffect(state, "crewLossMult");
  //   if (crewLossMult !== 1) combined.player.crewLoss = Math.floor(combined.player.crewLoss * crewLossMult);
  //   const finalOutcome = applyDamageMoralePenalty(state, combined, battleState);
  //   finalOutcome.playerAction = action;
  //   finalOutcome.npcAction = npcOutcome ? npcOutcome.action : null;
  //   finalOutcome.playerHit = playerHit;
  //   finalOutcome.playerGrappleSuccess = playerGrappleSuccess;
  //   finalOutcome.npcHit = npcOutcome ? npcOutcome.hit : null;
  //   finalOutcome.npcGrappleSuccess = npcOutcome ? npcOutcome.grappleSuccess : null;
  //   finalOutcome.playerCrewLossFromPlayerAction = combined.playerCrewLossFromPlayerAction;
  //   finalOutcome.playerCrewLossFromNpcAction = combined.playerCrewLossFromNpcAction;
  //   finalOutcome.enemyCrewLossFromPlayerAction = combined.enemyCrewLossFromPlayerAction;
  //   finalOutcome.enemyCrewLossFromNpcAction = combined.enemyCrewLossFromNpcAction;
  //   finalOutcome.playerHullDamageOutput = combined.playerHullDamageOutput;
  //   finalOutcome.npcHullDamageOutput = combined.npcHullDamageOutput;
  //   return finalOutcome;
  // };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  B11 – NAVAL & BOARDING RESOLVERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Shared contest helper
  const resolveSpeedContest = (actorSpeed, opposerSpeed) => {
    const chance = 0.5 + (actorSpeed - opposerSpeed) * 0.03;
    const clamped = Math.max(0.15, Math.min(0.85, chance));
    return Math.random() < clamped;
  };

  const stepDistance = (current, delta) => {
    const order = ["far", "medium", "close"];
    const idx = order.indexOf(current);
    return order[Math.max(0, Math.min(2, idx + delta))];
  };

  const initialDistanceFor = (encounterType) => {
    const closeRangeTypes = [
      "hostile_port_entry",
      "escort_defend",
      "navy_patrol_combat",
      "navy_patrol", 
      "assault",
    ];
    const farRangeTypes = [
      "distressed_merchant_help",
      "distressed_merchant_plunder",
      "patrol",
      "random",
    ];
    if (closeRangeTypes.includes(encounterType)) return "close";
    if (farRangeTypes.includes(encounterType)) return "far";
    return "medium";
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NPC STUB AI (Part 7 – temporary stub, to be replaced with scoring AI)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const maybeCrewLoss = (amount) => Math.random() < 0.5 ? 0 : Math.floor(amount);

 const emptyOutcome = () => ({
     player: { hullDamage: 0, crewLoss: 0 },
    enemy: { hullDamage: 0, crewLoss: 0 },
     moraleDelta: 0,
    fled: false,
     instantVictory: false,
     goldReward: 0,
     enemyCargo: {},
   });

// Naval stub – picks based on distance and hull condition.
// See design doc Section 8 – this is explicitly a stub, not the final tuned AI.
const getNPCNavalAction = (battle, enemy) => {
  const distance = battle.distance;
  const hullPct = battle.enemyHull / enemy.hull;

  // If at Close and hull is low, try to open distance (flee the danger zone)
  if (distance === "close" && hullPct < 0.3 && Math.random() < 0.3) {
    return "open_distance";
  }

  // Occasionally try to close distance if not already Close
  if (distance !== "close" && Math.random() < 0.15) {
    return "close_distance";
  }

  // Otherwise, fire: 70% broadside, 30% precision
  return Math.random() < 0.7 ? "broadside" : "precision";
};

// Boarding stub – picks based on ratio.
// See design doc Section 8 – stub only, replaced later.
const getNPCBoardingAction = (battle, enemy, ratio) => {
  // Enemy side's effective ratio (1 - player ratio)
  const enemyRatio = 1 - ratio;

  // If enemy is severely outmatched (ratio < 0.25):
  // 25% chance to surrender, 5% chance to fall back, otherwise continue fighting.
  if (enemyRatio < 0.25) {
    const roll = Math.random();
    if (roll < 0.25) return "surrender";
    if (roll < 0.30) return "fall_back";
    return "continue_fighting";
  }

  // Otherwise, always continue fighting
  return "continue_fighting";
};

const resolveNavalRound = (state, playerAction, enemyAction, battle, enemy) => {
  const distance = battle.distance;
  const shipStats = window.L.getShipStats(state);
  const playerSpeed = shipStats.speed;
  const enemySpeed = enemy.speed || 10;

  // Helper: calculate broadside damage (hull + crew) for an actor
  const calcBroadside = (cannons, dist) => {
    const mult = window.D.DISTANCE_DAMAGE_MULTIPLIERS.broadside[dist] || 1.0;
    const dmg = cannons * (0.8 + Math.random() * 0.4);
    const hullDmg = Math.max(1, Math.floor(dmg * 0.6 * mult));
    const crewLoss = window.L.maybeCrewLoss(dmg * 0.4 / 3 * mult);
    return { hullDamage: hullDmg, crewLoss: crewLoss };
  };

  // Helper: calculate precision damage (hit chance, hull+crew)
  const calcPrecision = (cannons, dist) => {
    const mult = window.D.DISTANCE_DAMAGE_MULTIPLIERS.precision[dist] || 1.0;
    const hitChance = 0.7 + (window.L.getEquipmentEffect(state, "precisionHitPct") || 0);
    const hit = Math.random() < hitChance;
    if (!hit) return { hullDamage: 0, crewLoss: 0, hit: false };
    const dmg = cannons * (1.2 + Math.random() * 0.6);
    const hullDmg = Math.floor(dmg * 0.9 * mult);
    const crewLoss = window.L.maybeCrewLoss(dmg * 0.1 / 3 * mult);
    return { hullDamage: hullDmg, crewLoss: crewLoss, hit: true };
  };

  // Step 1: Evade (contested only vs Close Distance)
  if (playerAction === "evade") {
    const opposed = enemyAction === "close_distance";
    if (!opposed) {
      return { outcome: "player_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
    }
    const succeeds = window.L.resolveSpeedContest(playerSpeed, enemySpeed);
    if (succeeds) {
      return { outcome: "player_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
    }
    const newDistance = window.L.stepDistance(distance, -1);
    return { outcome: "continue", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [] };
  }

  if (enemyAction === "evade") {
    const opposed = playerAction === "close_distance";
    if (!opposed) {
      return { outcome: "enemy_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
    }
    const succeeds = window.L.resolveSpeedContest(enemySpeed, playerSpeed);
    if (succeeds) {
      return { outcome: "enemy_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
    }
    const newDistance = window.L.stepDistance(distance, -1);
    return { outcome: "continue", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [] };
  }

  // Step 2: Damage (Broadside / Precision)
  let playerHullDamage = 0, enemyHullDamage = 0;
  let playerCrewLoss = 0, enemyCrewLoss = 0;
  let playerHit = false, enemyHit = false;

  if (playerAction === "broadside") {
    const result = calcBroadside(shipStats.cannons, distance);
    enemyHullDamage += result.hullDamage;
    enemyCrewLoss += result.crewLoss;
  } else if (playerAction === "precision") {
    const result = calcPrecision(shipStats.cannons, distance);
    playerHit = result.hit;
    enemyHullDamage += result.hullDamage;
    enemyCrewLoss += result.crewLoss;
  }

  if (enemyAction === "broadside") {
    const result = calcBroadside(enemy.cannons, distance);
    playerHullDamage += result.hullDamage;
    playerCrewLoss += result.crewLoss;
  } else if (enemyAction === "precision") {
    const result = calcPrecision(enemy.cannons, distance);
    enemyHit = result.hit;
    playerHullDamage += result.hullDamage;
    playerCrewLoss += result.crewLoss;
  }

  // Step 3: Hull/Crew check
  const newPlayerHull = Math.max(0, battle.playerHull - playerHullDamage);
  const newEnemyHull = Math.max(0, battle.enemyHull - enemyHullDamage);
  const newPlayerCrew = Math.max(0, battle.playerCrew - playerCrewLoss);
  const newEnemyCrew = Math.max(0, battle.enemyCrew - enemyCrewLoss);

  const playerDefeated = newPlayerHull === 0 || newPlayerCrew === 0;
  const enemyDefeated = newEnemyHull === 0 || newEnemyCrew === 0;

  if (playerDefeated || enemyDefeated) {
    if (playerDefeated) {
      const outcome = newPlayerHull === 0 ? "player_sunk" : "player_captured";
      return {
        outcome,
        playerHullDamage,
        enemyHullDamage,
        playerCrewLoss,
        enemyCrewLoss,
        newDistance: null,
        distanceChangeWinner: null,
        playerHit,
        npcHit: enemyHit,
        playerGrappleSuccess: false,
        npcGrappleSuccess: false,
        fled: false,
        log: []
      };
    }
    const outcome = newEnemyHull === 0 ? "enemy_sunk" : "enemy_captured";
    return {
      outcome,
      playerHullDamage,
      enemyHullDamage,
      playerCrewLoss,
      enemyCrewLoss,
      newDistance: null,
      distanceChangeWinner: null,
      playerHit,
      npcHit: enemyHit,
      playerGrappleSuccess: false,
      npcGrappleSuccess: false,
      fled: false,
      log: []
    };
  }

  // Step 4: Reposition
  let newDistance = distance;
  let distanceChangeWinner = null;
  const bothClose = playerAction === "close_distance" && enemyAction === "close_distance";
  const bothOpen = playerAction === "open_distance" && enemyAction === "open_distance";
  const closeOpenContest = (playerAction === "close_distance" && enemyAction === "open_distance") ||
                            (playerAction === "open_distance" && enemyAction === "close_distance");

  if (bothClose) {
    newDistance = window.L.stepDistance(distance, +1);
    distanceChangeWinner = "none";
  } else if (bothOpen) {
    newDistance = window.L.stepDistance(distance, -1);
    distanceChangeWinner = "none";
  } else if (closeOpenContest) {
    const playerWantsClose = playerAction === "close_distance";
    const actorSpeed = playerWantsClose ? playerSpeed : enemySpeed;
    const opposerSpeed = playerWantsClose ? enemySpeed : playerSpeed;
    const actorWins = window.L.resolveSpeedContest(actorSpeed, opposerSpeed);
    if (actorWins) {
      newDistance = window.L.stepDistance(distance, playerWantsClose ? +1 : -1);
      distanceChangeWinner = playerWantsClose ? "player" : "enemy";
    } else {
      newDistance = window.L.stepDistance(distance, playerWantsClose ? -1 : +1);
      distanceChangeWinner = playerWantsClose ? "enemy" : "player";
    }
  } else if (playerAction === "close_distance" || playerAction === "open_distance") {
    newDistance = window.L.stepDistance(distance, playerAction === "close_distance" ? +1 : -1);
    distanceChangeWinner = "player";
  } else if (enemyAction === "close_distance" || enemyAction === "open_distance") {
    newDistance = window.L.stepDistance(distance, enemyAction === "close_distance" ? +1 : -1);
    distanceChangeWinner = "enemy";
  }

  // Step 5: Grapple (only if newDistance is "close")
  const playerGrapples = playerAction === "grapple" && newDistance === "close";
  const enemyGrapples = enemyAction === "grapple" && newDistance === "close";

  if (playerGrapples || enemyGrapples) {
    return {
      outcome: "boarding_begins",
      playerHullDamage,
      enemyHullDamage,
      playerCrewLoss,
      enemyCrewLoss,
      newDistance,
      distanceChangeWinner,
      playerHit,
      npcHit: enemyHit,
      playerGrappleSuccess: playerGrapples,
      npcGrappleSuccess: enemyGrapples,
      fled: false,
      log: []
    };
  }

  return {
    outcome: "continue",
    playerHullDamage,
    enemyHullDamage,
    playerCrewLoss,
    enemyCrewLoss,
    newDistance,
    distanceChangeWinner,
    playerHit,
    npcHit: enemyHit,
    playerGrappleSuccess: false,
    npcGrappleSuccess: false,
    fled: false,
    log: []
  };
};

  const RISK_MORALE_STANDIN = { low: 50, medium: 65, high: 80, assault: 90 };

  const getBoardingRatio = (state, battle, enemy) => {
    const playerMorale = state.crew.morale;
    const playerEffective = battle.playerCrew * (0.5 + playerMorale / 200);

    const enemyMorale = RISK_MORALE_STANDIN[enemy.risk] ?? 60;
    const enemyEffective = battle.enemyCrew * (0.5 + enemyMorale / 200);

    const total = playerEffective + enemyEffective;
    return total === 0 ? 0.5 : playerEffective / total;
  };

  const resolveBoardingRound = (state, playerAction, enemyAction, battle, enemy) => {
    // Step 1: Surrender
    if (playerAction === "surrender" || enemyAction === "surrender") {
      const whoSurrendered = playerAction === "surrender" ? "player" : "enemy";
      return {
        outcome: `${whoSurrendered}_surrendered`,
        playerCrewLoss: 0,
        enemyCrewLoss: 0,
        newRatio: null,
        log: [],
      };
    }

    // Step 2: Demand Surrender vs Fall Back – automatic success
    if (playerAction === "demand_surrender" && enemyAction === "fall_back") {
      return { outcome: "enemy_win_capture", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
    }
    if (enemyAction === "demand_surrender" && playerAction === "fall_back") {
      return { outcome: "player_defeated_by_demand", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
    }

    const ratio = getBoardingRatio(state, battle, enemy);

    // Step 3: Demand Surrender vs Continue – probability roll
    if (playerAction === "demand_surrender") {
      if (ratio < 0.65) {
        throw new Error("Demand Surrender declared below threshold – UI should have blocked this");
      }
      const successChance = (ratio - 0.5) * 2;
      if (Math.random() < successChance) {
        return { outcome: "enemy_win_capture", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
      }
      const cost = Math.ceil(battle.playerCrew * 0.15 * (1 - ratio));
      const newPlayerCrew = Math.max(0, battle.playerCrew - cost);
      if (newPlayerCrew === 0) {
        return { outcome: "player_wipeout", playerCrewLoss: cost, enemyCrewLoss: 0, newRatio: null, log: [] };
      }
      const newRatio = getBoardingRatio(
        { ...state, crew: { ...state.crew, roster: [] } },
        { ...battle, playerCrew: newPlayerCrew },
        enemy
      );
      return { outcome: "continue", playerCrewLoss: cost, enemyCrewLoss: 0, newRatio, log: [] };
    }

    if (enemyAction === "demand_surrender") {
      const enemyRatio = 1 - ratio;
      if (enemyRatio < 0.65) {
        throw new Error("Enemy Demand Surrender below threshold – AI should not have chosen this");
      }
      const successChance = (enemyRatio - 0.5) * 2;
      if (Math.random() < successChance) {
        return { outcome: "player_defeated_by_demand", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
      }
      const cost = Math.ceil(battle.enemyCrew * 0.15 * ratio);
      const newEnemyCrew = Math.max(0, battle.enemyCrew - cost);
      if (newEnemyCrew === 0) {
        return { outcome: "enemy_wipeout", playerCrewLoss: 0, enemyCrewLoss: cost, newRatio: null, log: [] };
      }
      const newRatio = getBoardingRatio(
        state,
        { ...battle, enemyCrew: newEnemyCrew },
        enemy
      );
      return { outcome: "continue", playerCrewLoss: 0, enemyCrewLoss: cost, newRatio, log: [] };
    }

    // Step 4: Fall Back
    const bothFallBack = playerAction === "fall_back" && enemyAction === "fall_back";
    if (bothFallBack) {
      return { outcome: "returned_to_naval", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
    }
    if (playerAction === "fall_back") {
      const cost = Math.ceil(battle.playerCrew * 0.15 * (1 - ratio));
      const newPlayerCrew = Math.max(0, battle.playerCrew - cost);
      if (newPlayerCrew === 0) {
        return { outcome: "player_wipeout", playerCrewLoss: cost, enemyCrewLoss: 0, newRatio: null, log: [] };
      }
      return { outcome: "returned_to_naval", playerCrewLoss: cost, enemyCrewLoss: 0, newRatio: null, log: [] };
    }
    if (enemyAction === "fall_back") {
      const cost = Math.ceil(battle.enemyCrew * 0.15 * ratio);
      const newEnemyCrew = Math.max(0, battle.enemyCrew - cost);
      if (newEnemyCrew === 0) {
        return { outcome: "enemy_wipeout", playerCrewLoss: 0, enemyCrewLoss: cost, newRatio: null, log: [] };
      }
      return { outcome: "returned_to_naval", playerCrewLoss: 0, enemyCrewLoss: cost, newRatio: null, log: [] };
    }

    // Step 5: Continue vs Continue
    const playerLoss = Math.ceil(battle.playerCrew * 0.15 * (1 - ratio));
    const enemyLoss  = Math.ceil(battle.enemyCrew * 0.15 * ratio);
    const newPlayerCrew = Math.max(0, battle.playerCrew - playerLoss);
    const newEnemyCrew  = Math.max(0, battle.enemyCrew - enemyLoss);

    const playerWiped = newPlayerCrew === 0;
    const enemyWiped  = newEnemyCrew === 0;
    if (playerWiped || enemyWiped) {
      const outcome = playerWiped ? "player_wipeout" : "enemy_wipeout";
      return { outcome, playerCrewLoss: playerLoss, enemyCrewLoss: enemyLoss, newRatio: null, log: [] };
    }

    const newRatio = getBoardingRatio(
      state,
      { ...battle, playerCrew: newPlayerCrew, enemyCrew: newEnemyCrew },
      enemy
    );
    return {
      outcome: "continue",
      playerCrewLoss: playerLoss,
      enemyCrewLoss: enemyLoss,
      newRatio,
      log: [],
    };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ENCOUNTER CONTEXT BUILDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function buildEncounterContext(state, type, enemy) {
    const shipStats = window.L.getShipStats(state);
    const mySpeed = shipStats.speed;
    const enemyShip = window.L.guessShipType(enemy);
    const eSpeed = SHIPS[enemyShip]?.speed ?? 5;
    const rep = state.reputation[state.destination ?? state.currentPort] ?? 20;
    const gold = state.gold;
    const bribeCost = Math.round((enemy.gold ?? 500) * 0.4);

    const noFleeTypes = ["hostile_port_entry", "bounty_target", "mission_combat", "navy_patrol", "navy_patrol_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const canFlee = !noFleeTypes.includes(type);
    const fleeReason = canFlee ? null
      : type === "hostile_port_entry" ? "Already in range of the harbour guns"
      : type === "navy_patrol" || type === "navy_patrol_combat" ? "You cannot outrun a patrol in open waters"
      : "The target is cornered. No escape";

    const noParleyTypes = ["hostile_port_entry", "bounty_target", "mission_combat", "smuggling_caught", "navy_patrol", "navy_patrol_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const canParley = !noParleyTypes.includes(type) && rep >= 30;
    const parleyReason = noParleyTypes.includes(type) ? "They are not here to negotiate" : rep < 30 ? `Reputation too low (${rep} : need 30)` : null;

    const noBribeTypes = ["hostile_port_entry", "bounty_target", "mission_combat", "navy_patrol", "navy_patrol_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const bribeBlocked = noBribeTypes.includes(type);
    const canAffordBribe = gold >= bribeCost;
    const bribeInfamyBlocked = !window.L.canBribe(state);
    const canBribeResult = !bribeBlocked && canAffordBribe && !bribeInfamyBlocked;
    const bribeReason = bribeBlocked ? "They cannot be bought"
      : bribeInfamyBlocked ? "Your reputation for bribery has preceded you"
      : !canAffordBribe ? `Need ${bribeCost}g (you have ${gold}g)` : null;

    const noSurrenderTypes = ["bounty_target", "mission_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const canSurrender = !noSurrenderTypes.includes(type);
    const surrenderReason = canSurrender ? null : "Surrender means death here";

    if (type === "distressed_merchant_help" || type === "distressed_merchant_plunder" || type === "escort_defend") {
      return {
        type,
        encounterType: type,
        enemy: { ...enemy, ship: enemyShip },
        flavourText: ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ?? `A ${enemy.name} moves to intercept.`,
        options: [{
          id: "fight",
          label: "Fight",
          available: true,
          reason: null,
          action: { type: "INTERCEPT_FIGHT" },
          speedCheck: null,
        }],
      };
    }

    const isNavyPatrol = type === "navy_patrol" || type === "navy_patrol_combat";
    const options = [];
    if (isNavyPatrol) {
      options.push({
        id: "inspect",
        label: "Allow Inspection",
        available: true,
        reason: null,
        action: { type: "PATROL_INSPECT" },
        speedCheck: null,
      });
      options.push({
        id: "fight",
        label: "Refuse and Open Fire",
        available: true,
        reason: null,
        action: { type: "INTERCEPT_FIGHT" },
        speedCheck: null,
      });
    } else {
      options.push({
        id: "fight",
        label: "Fight",
        available: true,
        reason: null,
        action: { type: "INTERCEPT_FIGHT" },
        speedCheck: null,
      });
      options.push({
        id: "flee",
        label: "Attempt to Flee",
        available: canFlee,
        reason: fleeReason,
        action: { type: "INTERCEPT_FLEE" },
        speedCheck: canFlee ? { player: mySpeed, enemy: eSpeed } : null,
      });
      options.push({
        id: "parley",
        label: "Parley",
        available: canParley,
        reason: parleyReason,
        action: { type: "INTERCEPT_PARLEY" },
        speedCheck: null,
      });
      options.push({
        id: "bribe",
        label: canBribeResult ? `Bribe (${bribeCost}g)` : "Bribe",
        available: canBribeResult,
        reason: bribeReason,
        action: { type: "INTERCEPT_BRIBE" },
        speedCheck: null,
      });
      options.push({
        id: "surrender",
        label: "Surrender",
        available: canSurrender,
        reason: surrenderReason,
        action: { type: "INTERCEPT_SURRENDER" },
        speedCheck: null,
      });
    }
    return {
      type,
      encounterType: type,
      enemy: { ...enemy, ship: enemyShip },
      flavourText: ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ?? `A ${enemy.name} moves to intercept.`,
      options,
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EXPOSE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Object.assign(window.L, {
    // Old combat
   /*  
    getNPCAction,
    resolvePlayerAction,
    applyMoraleModifier,
    resolveNpcAction,
    applyDamageMoralePenalty,
    combineCombatOutcomes,
    resolveCombatAction,
 */
    // B11 combat
    emptyOutcome,
    maybeCrewLoss,
    getNPCNavalAction,
    getNPCBoardingAction,
    resolveNavalRound,
    getBoardingRatio,
    resolveBoardingRound,
    resolveSpeedContest,
    stepDistance,
    initialDistanceFor,

    // Encounter
    buildEncounterContext,
  });
})();