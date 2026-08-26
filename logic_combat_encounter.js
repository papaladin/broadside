// @ts-check
// logic_combat_encounter.js — Combat resolution (old + B11) and encounter building.
// Depends on logic_core.js and logic_economy_crew.js (must be loaded after).
// Exposed as window.L.

window.L = window.L || {};

(() => {
  const { SHIPS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE } = window.D;


// ─────────────────────────────────────────────────────────────
//  NPC COMBAT AI — UTILITY SCORING FUNCTIONS
//  (Planned per tasks_NPCAI.md — added before wiring into engine)
// ─────────────────────────────────────────────────────────────

// ── Tier 1: Static disposition computation ──────────────────
// Computes once per battle and stores on encounterSession.aiDisposition.
const computeAIDisposition = (state, enemy, encounterType) => {
  const archetype = window.D.AI_ARCHETYPES[enemy.faction] ?? window.D.AI_ARCHETYPES.pirate;
  const originMod = window.D.AI_ORIGIN_MODIFIERS[encounterType] ?? {};
  const riskMult = { low: 0.7, medium: 1.0, high: 1.3, assault: 1.6 }[enemy.risk] ?? 1.0;

  const heatLevel = state.factionAlerts?.[enemy.faction] ?? 0;
  const fame = state.fame ?? 0;
  const infamy = state.infamy ?? 0;

  return {
    weights: {
      broadside: archetype.broadside * riskMult,
      precision: archetype.precision * riskMult,
      close:     archetype.close * riskMult,   // ← NEW: risk now affects close/open
      open:      archetype.open * riskMult,    // ← NEW
      grapple:   (archetype.grapple + (originMod.grapple ?? 0)) * riskMult,
    },
    continueFightingBonus: (originMod.continueFighting ?? 0) + (heatLevel >= 5 ? 0.3 : 0) + (infamy >= 50 ? 0.15 : 0),
    surrenderWillingness: Math.max(0, 0.4 + (fame / 500) - (infamy / 300)),
    riskLevel: enemy.risk,
  };
};

// ── Tier 2: Dynamic signal helpers ──────────────────────────
// All return 0..1-ish normalized values, not raw stat differences.
const getHullAdvantage = (selfHull, selfMaxHull, oppHull, oppMaxHull) =>
  (selfHull / selfMaxHull) - (oppHull / oppMaxHull);

const getCrewAdvantage = (selfCrew, oppCrew) => {
  const total = selfCrew + oppCrew;
  return total === 0 ? 0 : (selfCrew - oppCrew) / total;
};

const getSpeedDifferential = (selfSpeed, oppSpeed) => selfSpeed - oppSpeed;

// ── Side-agnostic naval action scorer ───────────────────────
// self / opponent: { hull, maxHull, crew, speed }
const scoreNavalActions = (self, opponent, distance, disposition, legalActions) => {
  const hullAdv = getHullAdvantage(self.hull, self.maxHull, opponent.hull, opponent.maxHull);
  const crewAdv = getCrewAdvantage(self.crew, opponent.crew);
  const speedDiff = getSpeedDifferential(self.speed, opponent.speed);
  const w = disposition.weights;

  const distanceFit = {
    broadside: window.D.DISTANCE_DAMAGE_MULTIPLIERS.broadside[distance],
    precision: window.D.DISTANCE_DAMAGE_MULTIPLIERS.precision[distance],
  };

  const scores = {};
  if (legalActions.includes("broadside")) {
    scores.broadside = w.broadside * distanceFit.broadside * (1 - Math.max(0, -hullAdv));
  }
  if (legalActions.includes("precision")) {
    // Cap the hull‑disadvantage boost to +50%
    scores.precision = w.precision * distanceFit.precision * (1 + Math.min(0.5, Math.max(0, -hullAdv)));
  }
  if (legalActions.includes("close_distance")) {
    scores.close_distance = w.close * (0.5 + crewAdv * 2) * (speedDiff >= 0 ? 1.0 : 0.6);
  }
  if (legalActions.includes("open_distance")) {
    scores.open_distance = w.open * Math.max(0.2, 0.5 + Math.max(0, -hullAdv) + Math.max(0, -crewAdv)) * (speedDiff >= 0 ? 1.0 : 0.6);
  }
  if (legalActions.includes("grapple")) {
    // Dinghy protection: never board a dinghy
    if (opponent.shipType === 'dinghy') {
      scores.grapple = 0;
    } else {
      scores.grapple = w.grapple * (0.5 + crewAdv * 2);
    }
  }

  return scores;
};

// ── Side-agnostic boarding action scorer ─────────────────────
// ratio: from the self side's perspective (self's share of combined effectiveness)
// moraleThresholdShift: from disposition or a direct override
const scoreBoardingActions = (ratio, disposition, moraleThresholdShift = 0) => {
  const scores = {};
  scores.continue_fighting =
    (disposition.riskLevel === "high" || disposition.riskLevel === "assault" ? 1.2 : 1.0)
    + disposition.continueFightingBonus
    + ratio;

  const fallBackPressure = Math.max(0, 0.5 - ratio - moraleThresholdShift);
  scores.fall_back =
    (disposition.riskLevel === "low" ? 1.3 : disposition.riskLevel === "high" ? 0.6 : 1.0)
    * fallBackPressure * 2;

  // Surrender only scored (and only chosen) at genuinely low ratio
  scores.surrender = ratio < 0.25
    ? disposition.surrenderWillingness * (0.25 - ratio) * 4
    : 0;

  return scores;
};

// ── Weighted-random selector ────────────────────────────────
// Picks among the top `topN` scores, weighted by their relative values.
const selectWeightedAction = (scores, topN = 2) => {
  const entries = Object.entries(scores).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const pool = entries.slice(0, Math.min(topN, entries.length));
  const total = pool.reduce((sum, [, v]) => sum + v, 0);
  let roll = Math.random() * total;
  for (const [action, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return action;
  }
  return pool[0][0]; // fallback
};

// ── New wrappers that use the utility scoring system ──────────────────
// These are NOT yet called by the engine – they will replace the stubs
// once the engine call sites are updated (Part 4).

const getNPCNavalAction = (state, encounterSession) => {
  const { distance } = encounterSession.battle;
  const enemy = encounterSession.enemy;
  const disposition = encounterSession.aiDisposition
    ?? computeAIDisposition(state, enemy, encounterSession.type);

  const self = {
    hull: encounterSession.battle.enemyHull,
    maxHull: enemy.maxHull,
    crew: encounterSession.battle.enemyCrew, 
    speed: enemy.speed,

  };
  const opponent = {
    hull: encounterSession.battle.playerHull,
    maxHull: window.L.getShipStats(state).maxHull,
    crew: encounterSession.battle.playerCrew,
    speed: window.L.getShipStats(state).speed,
    shipType: state.ship.type, 
  };

  const legalActions = window.D.LEGAL_ACTIONS_BY_DISTANCE[distance];
  const scores = scoreNavalActions(self, opponent, distance, disposition, legalActions);
  const chosen = selectWeightedAction(scores);
  return chosen ?? "broadside"; 
};

const getNPCBoardingAction = (state, encounterSession) => {
  const battle = encounterSession.battle;
  const enemy = encounterSession.enemy;
  const ratio = 1 - window.L.getBoardingRatio(state, battle, enemy); // enemy's own share
  const disposition = encounterSession.aiDisposition
    ?? computeAIDisposition(state, enemy, encounterSession.type);
  const moraleShift = { low: -0.1, medium: 0, high: 0.1, assault: 0.2 }[disposition.riskLevel] ?? 0;

  const scores = scoreBoardingActions(ratio, disposition, moraleShift);
  const chosen = selectWeightedAction(scores, 2);
  return chosen ?? "continue_fighting";
};

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //   NAVAL & BOARDING RESOLVERS
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
      "navy_patrol",
      "assault",
    ];
    const farRangeTypes = [
      "distressed_merchant_help",
      "distressed_merchant_plunder",
      "patrol",
      "pirate_ambuhs",
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

    // ── Convoy damage (for escort missions and merchant defense) ──
    let convoyDamage = 0;
    if (battle.convoyHull !== undefined && battle.convoyHull > 0) {
      // Enemy actions that damage the convoy: broadside and precision
      if (enemyAction === "broadside") {
        convoyDamage = Math.floor(Math.random() * 4) + 2; // 2-5 damage
      } else if (enemyAction === "precision") {
        if (Math.random() < 0.7) {
          convoyDamage = Math.floor(Math.random() * 6) + 3; // 3-8 damage
        } else {
          convoyDamage = 0;
        }
      }
    }

    // Step 1: Evade
    if (playerAction === "evade") {
      const opposed = enemyAction === "close_distance";
      if (!opposed) {
        return { outcome: "player_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [], convoyDamage: 0 };
      }
      const succeeds = resolveSpeedContest(playerSpeed, enemySpeed);
      if (succeeds) {
        return { outcome: "player_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [], convoyDamage: 0 };
      }
      const newDistance = stepDistance(distance, -1);
      return { outcome: "continue", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [], convoyDamage: 0 };
    }
    if (enemyAction === "evade") {
      const opposed = playerAction === "close_distance";
      if (!opposed) {
        return { outcome: "enemy_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [], convoyDamage: 0 };
      }
      const succeeds = resolveSpeedContest(enemySpeed, playerSpeed);
      if (succeeds) {
        return { outcome: "enemy_evaded", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance: null, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: true, log: [], convoyDamage: 0 };
      }
      const newDistance = stepDistance(distance, -1);
      return { outcome: "continue", playerHullDamage: 0, enemyHullDamage: 0, playerCrewLoss: 0, enemyCrewLoss: 0, newDistance, distanceChangeWinner: null, playerHit: false, npcHit: false, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [], convoyDamage: 0 };
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
        return { outcome, playerHullDamage, enemyHullDamage, playerCrewLoss, enemyCrewLoss, newDistance: null, distanceChangeWinner: null, playerHit, npcHit: enemyHit, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [], convoyDamage };
      }
      const outcome = newEnemyHull === 0 ? "enemy_sunk" : "enemy_captured";
      return { outcome, playerHullDamage, enemyHullDamage, playerCrewLoss, enemyCrewLoss, newDistance: null, distanceChangeWinner: null, playerHit, npcHit: enemyHit, playerGrappleSuccess: false, npcGrappleSuccess: false, fled: false, log: [], convoyDamage };
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
        log: [],
        convoyDamage
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
      log: [],
      convoyDamage
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

    // ── Encounter-type-specific option availability ──

    // Fight types where fleeing is blocked (you're committed)
    const noFleeTypes = [
      "hostile_port_entry", "bounty_target", "mission_combat",
      "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend",
      "pirate_ambush"
    ];
    const canFlee = !noFleeTypes.includes(type);
    const fleeReason = canFlee ? null
      : type === "hostile_port_entry" ? "Already in range of the harbour guns"
      : type === "navy_patrol" ? "You cannot outrun a patrol in open waters"
      : "The target is cornered. No escape";

    // Parley blocked for combat/commitment encounters
    const noParleyTypes = [
      "hostile_port_entry", "bounty_target", "mission_combat",
      "smuggling_caught", "navy_patrol",
      "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend",
      "pirate_ambush"
    ];
    const canParley = !noParleyTypes.includes(type) && rep >= 30;
    const parleyReason = noParleyTypes.includes(type)
      ? "They are not here to negotiate"
      : rep < 30 ? `Reputation too low (${rep} : need 30)` : null;

    // Bribe blocked for combat/commitment encounters
    const noBribeTypes = [
      "hostile_port_entry", "bounty_target", "mission_combat",
      "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend",
      "pirate_ambush"
    ];
    const bribeBlocked = noBribeTypes.includes(type);
    const canAffordBribe = gold >= bribeCost;
    const bribeInfamyBlocked = !window.L.canBribe(state);
    const canBribeResult = !bribeBlocked && canAffordBribe && !bribeInfamyBlocked;
    const bribeReason = bribeBlocked
      ? "They cannot be bought"
      : bribeInfamyBlocked
        ? "Your reputation for bribery has preceded you"
        : !canAffordBribe
          ? `Need ${bribeCost}g (you have ${gold}g)`
          : null;

    // Surrender blocked for bounty/mission/merchant
    const noSurrenderTypes = [
      "bounty_target", "mission_combat",
      "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"
    ];
    const canSurrender = !noSurrenderTypes.includes(type);
    const surrenderReason = canSurrender ? null : "Surrender means death here";

    // ── Merchant / Escort / Plunder (custom options with disabled reasons) ──
    if (type === "distressed_merchant_help" || type === "distressed_merchant_plunder" || type === "escort_defend") {
      const options = [];

      // Fight (always available)
      options.push({
        id: "fight",
        label: "Fight",
        available: true,
        reason: null,
        action: { type: "INTERCEPT_FIGHT" },
        speedCheck: null,
      });

      // Flee (disabled – you're committed)
      const fleeReason = type === "escort_defend"
        ? "You cannot abandon the convoy"
        : type === "distressed_merchant_help"
          ? "You are committed to protecting the merchant"
          : "You have engaged the enemy";

      options.push({
        id: "flee",
        label: "Attempt to Flee",
        available: false,
        reason: fleeReason,
        action: null,
        speedCheck: null,
      });

      // Parley (disabled – they're not interested)
      options.push({
        id: "parley",
        label: "Parley",
        available: false,
        reason: type === "distressed_merchant_plunder"
          ? "The merchant crew is terrified – they won't negotiate"
          : "The enemy is not interested in talking",
        action: null,
        speedCheck: null,
      });

      // Bribe (disabled – they want blood, not gold)
      options.push({
        id: "bribe",
        label: "Bribe",
        available: false,
        reason: type === "distressed_merchant_plunder"
          ? "You are here to plunder – bribery is beneath you"
          : "They cannot be bought off",
        action: null,
        speedCheck: null,
      });

      // Surrender (available for defense, disabled for plunder)
      const canSurrender = type !== "distressed_merchant_plunder";
      options.push({
        id: "surrender",
        label: "Surrender",
        available: canSurrender,
        reason: canSurrender ? null : "There is no surrender in plunder",
        action: canSurrender ? { type: "INTERCEPT_SURRENDER" } : null,
        speedCheck: null,
      });

      return {
        type,
        encounterType: type,
        enemy: { ...enemy, ship: enemyShip },
        flavourText: ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ?? `A ${enemy.name} moves to intercept.`,
        options,
      };
    }

    // ── Navy Patrol (custom: Inspect + Fight + Bribe) ──
    const isNavyPatrol = type === "navy_patrol";
    const options = [];

    if (isNavyPatrol) {
      // Inspect
      options.push({
        id: "inspect",
        label: "Allow Inspection",
        available: true,
        reason: null,
        action: { type: "PATROL_INSPECT" },
        speedCheck: null,
      });

      // Fight
      options.push({
        id: "fight",
        label: "Refuse and Open Fire",
        available: true,
        reason: null,
        action: { type: "INTERCEPT_FIGHT" },
        speedCheck: null,
      });

      // ── Bribe (navy patrol only) ──
      // Calculate contraband value for bribe cost
      const items = state.hold?.items || {};
      const activeMission = state.activeMission;

      const hasTobacco = (items.tobacco || 0) > 0;
      const hasSlaves  = (items.slaves  || 0) > 0;
      const hasRumSmuggle = activeMission?.type === "smuggle"
        && activeMission?.requiredGood === "rum"
        && (items.rum || 0) > 0;

      let contrabandValue = 0;
      if (hasTobacco) contrabandValue += (items.tobacco || 0) * (window.D.RESOURCES.tobacco?.basePrice || 90);
      if (hasSlaves)  contrabandValue += (items.slaves  || 0) * (window.D.RESOURCES.slaves?.basePrice  || 220);
      if (hasRumSmuggle) contrabandValue += (items.rum     || 0) * (window.D.RESOURCES.rum?.basePrice     || 30);

      const bribeCost = Math.round(contrabandValue * 0.50 / 25) * 25;
      const canAfford = state.gold >= bribeCost;
      const infamyOk = (state.infamy ?? 0) < 25;
      const repOk = (state.reputation[state.destination ?? state.currentPort] ?? 0) > 50;
      const hasContraband = contrabandValue > 0;

      let bribeAvailable = false;
      let bribeDisabledReason = null;

      if (!hasContraband) {
        bribeDisabledReason = "You have no contraband – no need to bribe";
      } else if (!infamyOk) {
        bribeDisabledReason = "Your reputation for bribery has preceded you";
      } else if (!repOk) {
        bribeDisabledReason = "They don't trust you enough to take a bribe";
      } else if (!canAfford) {
        bribeDisabledReason = `Need ${bribeCost}g (you have ${state.gold}g)`;
      } else {
        bribeAvailable = true;
      }

      options.push({
        id: "bribe",
        label: canAfford ? `Bribe (${bribeCost}g)` : `Bribe (${bribeCost}g)`,
        available: bribeAvailable,
        reason: bribeDisabledReason,
        action: bribeAvailable ? { type: "INTERCEPT_BRIBE" } : null,
        speedCheck: null,
        cost: bribeCost,
      });

      // Note: Navy patrols do NOT get Flee, Parley, or Surrender
      return {
        type,
        encounterType: type,
        enemy: { ...enemy, ship: enemyShip },
        flavourText: ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ?? `A ${enemy.name} moves to intercept.`,
        options,
      };
    }

    // ── Generic encounter (Fight, Flee, Parley, Bribe, Surrender) ──
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
      action: canFlee ? { type: "INTERCEPT_FLEE" } : null,
      speedCheck: canFlee ? { player: mySpeed, enemy: eSpeed } : null,
    });

    options.push({
      id: "parley",
      label: "Parley",
      available: canParley,
      reason: parleyReason,
      action: canParley ? { type: "INTERCEPT_PARLEY" } : null,
      speedCheck: null,
    });

    options.push({
      id: "bribe",
      label: canBribeResult ? `Bribe (${bribeCost}g)` : "Bribe",
      available: canBribeResult,
      reason: bribeReason,
      action: canBribeResult ? { type: "INTERCEPT_BRIBE" } : null,
      speedCheck: null,
      cost: bribeCost,
    });

    options.push({
      id: "surrender",
      label: "Surrender",
      available: canSurrender,
      reason: surrenderReason,
      action: canSurrender ? { type: "INTERCEPT_SURRENDER" } : null,
      speedCheck: null,
    });

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

    // NPC AI scoring functions
    computeAIDisposition,
    getHullAdvantage,
    getCrewAdvantage,
    getSpeedDifferential,
    scoreNavalActions,
    scoreBoardingActions,
    selectWeightedAction, 
    // New wrappers (will replace stubs later)
    getNPCNavalAction,
    getNPCBoardingAction,
    // combat
    emptyOutcome,
    maybeCrewLoss,
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