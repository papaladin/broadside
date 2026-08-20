// logic_combat_encounter.js — Combat resolution (old + B11) and encounter building.
// Depends on logic_core.js and logic_economy_crew.js (must be loaded after).
// Exposed as window.L.

window.L = window.L || {};

(() => {
  const { SHIPS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE } = window.D;

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

  // Naval stub
  const getNPCNavalAction = (battle, enemy) => {
    const distance = battle.distance;
    const hullPct = battle.enemyHull / enemy.hull;
    if (distance === "close" && hullPct < 0.3 && Math.random() < 0.3) {
      return "open_distance";
    }
    if (distance !== "close" && Math.random() < 0.15) {
      return "close_distance";
    }
    return Math.random() < 0.7 ? "broadside" : "precision";
  };

  // Boarding stub
  const getNPCBoardingAction = (battle, enemy, ratio) => {
    const enemyRatio = 1 - ratio;
    if (enemyRatio < 0.25) {
      const roll = Math.random();
      if (roll < 0.25) return "surrender";
      if (roll < 0.30) return "fall_back";
      return "continue_fighting";
    }
    return "continue_fighting";
  };

  // ─── Full naval resolver ────────────────────────────────────────────────
  const resolveNavalRound = (state, playerAction, enemyAction, battle, enemy) => {
    const distance = battle.distance;
    const shipStats = window.L.getShipStats(state);
    const playerSpeed = shipStats.speed;
    const enemySpeed = enemy.speed || 10;

    // Equipment modifiers (player only – enemy equipment not implemented)
    const hullDmgPct = window.L.getEquipmentEffect(state, "hullDmgPct") || 0;
    const crewDmgPct = window.L.getEquipmentEffect(state, "crewDmgPct") || 0;
    const precisionHitPct = window.L.getEquipmentEffect(state, "precisionHitPct") || 0;

    const calcBroadside = (cannons, dist, isPlayer) => {
      const mult = window.D.DISTANCE_DAMAGE_MULTIPLIERS.broadside[dist] || 1.0;
      const dmg = cannons * (0.8 + Math.random() * 0.4);
      let hullDmg = Math.max(1, Math.floor(dmg * 0.6 * mult));
      let crewLoss = maybeCrewLoss(dmg * 0.4 / 3 * mult);
      if (isPlayer) {
        hullDmg = Math.floor(hullDmg * (1 + hullDmgPct));
        crewLoss = Math.floor(crewLoss * (1 + crewDmgPct));
      }
      return { hullDamage: hullDmg, crewLoss: crewLoss };
    };

    const calcPrecision = (cannons, dist, isPlayer) => {
      const mult = window.D.DISTANCE_DAMAGE_MULTIPLIERS.precision[dist] || 1.0;
      const hitChance = 0.7 + (isPlayer ? precisionHitPct : 0);
      const hit = Math.random() < hitChance;
      if (!hit) return { hullDamage: 0, crewLoss: 0, hit: false };
      const dmg = cannons * (1.2 + Math.random() * 0.6);
      let hullDmg = Math.floor(dmg * 0.9 * mult);
      let crewLoss = maybeCrewLoss(dmg * 0.1 / 3 * mult);
      if (isPlayer) {
        hullDmg = Math.floor(hullDmg * (1 + hullDmgPct));
        crewLoss = Math.floor(crewLoss * (1 + crewDmgPct));
      }
      return { hullDamage: hullDmg, crewLoss: crewLoss, hit: true };
    };

    // Step 1: Evade
    if (playerAction === "evade") {
      const opposed = enemyAction === "close_distance";
      if (!opposed) {
        return { outcome: "player_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
      }
      const succeeds = resolveSpeedContest(playerSpeed, enemySpeed);
      if (succeeds) {
        return { outcome: "player_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
      }
      const newDistance = stepDistance(distance, -1);
      return { outcome: "continue", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [] };
    }
    if (enemyAction === "evade") {
      const opposed = playerAction === "close_distance";
      if (!opposed) {
        return { outcome: "enemy_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
      }
      const succeeds = resolveSpeedContest(enemySpeed, playerSpeed);
      if (succeeds) {
        return { outcome: "enemy_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [] };
      }
      const newDistance = stepDistance(distance, -1);
      return { outcome: "continue", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [] };
    }

    // Step 2: Damage (Broadside / Precision)
    let playerHullDamage = 0, enemyHullDamage = 0;
    let playerCrewLoss = 0, enemyCrewLoss = 0;
    let playerHit = false, enemyHit = false;

    if (playerAction === "broadside") {
      const result = calcBroadside(shipStats.cannons, distance, true);
      enemyHullDamage += result.hullDamage;
      enemyCrewLoss += result.crewLoss;
    } else if (playerAction === "precision") {
      const result = calcPrecision(shipStats.cannons, distance, true);
      playerHit = result.hit;
      enemyHullDamage += result.hullDamage;
      enemyCrewLoss += result.crewLoss;
    }
    if (enemyAction === "broadside") {
      const result = calcBroadside(enemy.cannons, distance, false);
      playerHullDamage += result.hullDamage;
      playerCrewLoss += result.crewLoss;
    } else if (enemyAction === "precision") {
      const result = calcPrecision(enemy.cannons, distance, false);
      enemyHit = result.hit;
      playerHullDamage += result.hullDamage;
      playerCrewLoss += result.crewLoss;
    }

    // Step 3: Hull/Crew check
    const newPlayerHull = Math.max(0, battle.playerHull - playerHullDamage);
    const newEnemyHull = Math.max(0, battle.enemyHull - enemyHullDamage);
    const newPlayerCrew = Math.max(0, battle.playerCrew - playerCrewLoss);
    const newEnemyCrew = Math.max(0, battle.enemyCrew - enemyCrewLoss);
    const isSmallShip = state.ship.type === "dinghy" || state.ship.type === "cutter";
    const playerDefeated = newPlayerHull === 0 || (newPlayerCrew === 0 && !isSmallShip);
    const enemyDefeated = newEnemyHull === 0 || newEnemyCrew === 0;

    if (playerDefeated || enemyDefeated) {
      if (playerDefeated) {
        const outcome = newPlayerHull === 0 ? "player_sunk" : "player_captured";
        return { outcome, playerHullDamage, enemyHullDamage, playerCrewLoss, enemyCrewLoss, newDistance: null, distanceChangeWinner: null, playerHit, npcHit: enemyHit, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [] };
      }
      const outcome = newEnemyHull === 0 ? "enemy_sunk" : "enemy_captured";
      return { outcome, playerHullDamage, enemyHullDamage, playerCrewLoss, enemyCrewLoss, newDistance: null, distanceChangeWinner: null, playerHit, npcHit: enemyHit, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [] };
    }

    // Step 4: Reposition
    let newDistance = distance;
    let distanceChangeWinner = null;
    const bothClose = playerAction === "close_distance" && enemyAction === "close_distance";
    const bothOpen = playerAction === "open_distance" && enemyAction === "open_distance";
    const closeOpenContest = (playerAction === "close_distance" && enemyAction === "open_distance") ||
                            (playerAction === "open_distance" && enemyAction === "close_distance");
    if (bothClose) {
      newDistance = stepDistance(distance, +1);
      distanceChangeWinner = "none";
    } else if (bothOpen) {
      newDistance = stepDistance(distance, -1);
      distanceChangeWinner = "none";
    } else if (closeOpenContest) {
      const playerWantsClose = playerAction === "close_distance";
      const actorSpeed = playerWantsClose ? playerSpeed : enemySpeed;
      const opposerSpeed = playerWantsClose ? enemySpeed : playerSpeed;
      const actorWins = resolveSpeedContest(actorSpeed, opposerSpeed);
      if (actorWins) {
        newDistance = stepDistance(distance, playerWantsClose ? +1 : -1);
        distanceChangeWinner = playerWantsClose ? "player" : "enemy";
      } else {
        newDistance = stepDistance(distance, playerWantsClose ? -1 : +1);
        distanceChangeWinner = playerWantsClose ? "enemy" : "player";
      }
    } else if (playerAction === "close_distance" || playerAction === "open_distance") {
      newDistance = stepDistance(distance, playerAction === "close_distance" ? +1 : -1);
      distanceChangeWinner = "player";
    } else if (enemyAction === "close_distance" || enemyAction === "open_distance") {
      newDistance = stepDistance(distance, enemyAction === "close_distance" ? +1 : -1);
      distanceChangeWinner = "enemy";
    }

    // Step 5: Grapple
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
    const effectivePlayerCrew = battle.playerCrew + 1; // captain always included
    const playerEffective = effectivePlayerCrew * (0.5 + playerMorale / 200);

    const enemyMorale = RISK_MORALE_STANDIN[enemy.risk] ?? 60;
    const enemyEffective = battle.enemyCrew * (0.5 + enemyMorale / 200);

    const total = playerEffective + enemyEffective;
    return total === 0 ? 0.5 : playerEffective / total;
  };

  const resolveBoardingRound = (state, playerAction, enemyAction, battle, enemy) => {
    if (playerAction === "surrender" || enemyAction === "surrender") {
      const whoSurrendered = playerAction === "surrender" ? "player" : "enemy";
      return { outcome: `${whoSurrendered}_surrendered`, playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
    }
    if (playerAction === "demand_surrender" && enemyAction === "fall_back") {
      return { outcome: "enemy_win_capture", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
    }
    if (enemyAction === "demand_surrender" && playerAction === "fall_back") {
      return { outcome: "player_defeated_by_demand", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
    }

    const ratio = getBoardingRatio(state, battle, enemy);

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

    const bothFallBack = playerAction === "fall_back" && enemyAction === "fall_back";
    if (bothFallBack) {
      return { outcome: "returned_to_naval", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
    }
    if (playerAction === "fall_back") {
      const cost = Math.ceil(battle.playerCrew * 0.15 * (1 - ratio));
      const newPlayerCrew = Math.max(0, battle.playerCrew - cost);
      const isSmallShip = state.ship.type === "dinghy" || state.ship.type === "cutter";
      if (newPlayerCrew === 0 && isSmallShip && battle.playerCrew === 0) {
        return { outcome: "returned_to_naval", playerCrewLoss: 0, enemyCrewLoss: 0, newRatio: null, log: [] };
      }
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

    const playerLoss = Math.ceil(battle.playerCrew * 0.15 * (1 - ratio));
    const enemyLoss = Math.ceil(battle.enemyCrew * 0.15 * ratio);
    const newPlayerCrew = Math.max(0, battle.playerCrew - playerLoss);
    const newEnemyCrew = Math.max(0, battle.enemyCrew - enemyLoss);
    const playerWiped = newPlayerCrew === 0;
    const enemyWiped = newEnemyCrew === 0;
    if (playerWiped || enemyWiped) {
      const outcome = playerWiped ? "player_wipeout" : "enemy_wipeout";
      return { outcome, playerCrewLoss: playerLoss, enemyCrewLoss: enemyLoss, newRatio: null, log: [] };
    }
    const newRatio = getBoardingRatio(
      state,
      { ...battle, playerCrew: newPlayerCrew, enemyCrew: newEnemyCrew },
      enemy
    );
    return { outcome: "continue", playerCrewLoss: playerLoss, enemyCrewLoss: enemyLoss, newRatio, log: [] };
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
    const bribeCost = Math.round(((enemy.gold ?? (enemy.cannons * 10 + enemy.crew * 5)) || 500) * 0.4);

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
        cost: bribeCost,
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