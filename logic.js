// ═══════════════════════════════════════════════════════════════════
//  logic.js — ALL PURE FUNCTIONS FOR GAME LOGIC
//  No side effects, no state mutation. Only calculations and data transformations.
//  Imports: window.D (data constants)
//  Exposed as window.L for global access.
// ═══════════════════════════════════════════════════════════════════

window.L = (() => {
  // Destructure constants for easier access
  const { PORTS, SHIPS, FACTIONS, UPGRADES, MISSION_POOL, RANDOM_EVENTS, STARTS, FACTION_RELATIONS } = window.D;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SAVE/LOAD FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const hasSave = () => {
    return !!localStorage.getItem("piratesSave");
  };

  const saveGame = (state) => {
    localStorage.setItem("piratesSave", JSON.stringify(state));
  };

  const loadGame = () => {
    const saved = localStorage.getItem("piratesSave");
    return saved ? JSON.parse(saved) : null;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HELPER FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const canAfford = (state, cost) => {
    return state.gold >= cost;
  };

  const reputationLabel = (rep) => {
    if (rep >= 80) return "Allied";
    if (rep >= 60) return "Friendly";
    if (rep >= 40) return "Neutral";
    if (rep >= 20) return "Unfriendly";
    if (rep >= 10) return "Hostile";
    return "At War";
  };

  const hasUpgrade = (state, upgradeKey) => {
    return state.ship.upgrades.includes(upgradeKey);
  };

  const getEffectiveMorale = (state) => {
    const shipStats = getShipStats(state);
    const moraleBonus = shipStats.moraleBonus || 0;
   return Math.min(100, state.crew.morale + moraleBonus); // Cap at 100%
  };

  const getShipStats = (state) => {
    const ship = SHIPS[state.ship.type];
    const stats = { ...ship };
    // Apply upgrades
    state.ship.upgrades.forEach(upgradeKey => {
      const upgrade = UPGRADES[upgradeKey];
      if (!upgrade) return;
      if (upgrade.effects.hullBonus) {
        stats.maxHull = Math.floor(stats.maxHull * (1 + upgrade.effects.hullBonus));
      }
      if (upgrade.effects.cannonBonus) {
        stats.cannons += upgrade.effects.cannonBonus;
      }
      if (upgrade.effects.speedBonus) {
        stats.speed += upgrade.effects.speedBonus;
      }
      if (upgrade.effects.moraleBonus) {
        stats.moraleBonus = (stats.moraleBonus || 0) + upgrade.effects.moraleBonus; // Track morale bonus
      }
    });
    return stats;
  };

  // (getEffectiveMorale defined above in helpers section)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SHIP & REPAIR FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const shipRepairCost = (state) => {
    const ship = getShipStats(state);
    const hullMissing = ship.maxHull - state.ship.hull;
    return hullMissing * 2; // 2 gold per hull point
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  TRAVEL FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const travelDays = (fromPort, toPort, state) => {
    const from = PORTS[fromPort];
    const to = PORTS[toPort];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);

    const ship = getShipStats(state);
    let days = Math.ceil(distance / (ship.speed * 10));

    // Morale modifier
    if (state.crew.morale < 50) days += 1;
    if (state.crew.morale < 30) days += 1;

    // Wind modifier
    const angleToPort = Math.atan2(dy, dx) * 180 / Math.PI;
    const windAngleDiff = Math.abs(angleToPort - state.wind.angle) % 360;
    if (windAngleDiff < 45 || windAngleDiff > 315) days -= 1; // Favorable wind
    else if (windAngleDiff > 135 && windAngleDiff < 225) days += 1; // Opposing wind

    return Math.max(1, days); // Minimum 1 day
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REPUTATION FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const decayReputation = (state) => {
    const newRep = { ...state.reputation };
    Object.keys(newRep).forEach(port => {
      if (newRep[port] > 50) {
        newRep[port] = Math.max(50, newRep[port] - 1);
      }
    });
    return newRep;
  };

  const updateReputation = (state, port, delta) => {
    const newRep = { ...state.reputation };
    newRep[port] = Math.max(0, Math.min(100, (newRep[port] || 50) + delta));
    return newRep;
  };

  // Apply reputation impact from an object (e.g., { english: +10, spanish: -5 })
  const applyReputationImpact = (state, repImpact) => {
    const newRep = { ...state.reputation };
    Object.entries(repImpact).forEach(([faction, delta]) => {
      Object.keys(PORTS).forEach(port => {
        if (PORTS[port].faction === faction) {
          newRep[port] = Math.max(0, Math.min(100, (newRep[port] || 50) + delta));
        }
      });
    });
    return newRep;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CREW FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const payCrewWages = (state) => {
    const effectiveMorale = getEffectiveMorale(state);
    const wageMultiplier = effectiveMorale < 30 ? 1.5 : 1;
    const wages = Math.floor(state.crew.current * 2 * wageMultiplier);
    return wages;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  MISSION FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const generateMissions = (portKey, state) => {
    const port = PORTS[portKey];
    const faction = port.faction;
    const playerRep = state.reputation[portKey] ?? 50; // use ?? so 0 is not overwritten

    // Filter missions:
    // 1. Must be for the port's faction or pirate
    // 2. Player rep must be high enough for high-risk missions
    const availableMissions = MISSION_POOL.filter(mission => {
      if (mission.faction !== faction && mission.faction !== "pirate") {
        return false;
      }
       // Treat undefined or unexpected risk as high risk
      const risk = mission.risk || "high";
      if (mission.risk === "high" && playerRep < 40) {
        return false;
      }
      if (mission.risk === "medium" && playerRep < 20) {
        return false;
      }
      return true;
    });

    // Randomly select 2-3 missions
    const shuffled = [...availableMissions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3 missions
  };

  const completeMissionOnCombatVictory = (state, mission) => {
    if (!mission) return state;
    return {
      ...state,
      gold: state.gold + mission.gold,
      fame: state.fame + mission.fame,
      reputation: L.applyReputationImpact(state, mission.repImpact),
      activeMission: null,
      missions: L.generateMissions(state.currentPort, state),
      log: [...state.log, `Mission complete: ${mission.name}. +${mission.gold}g, +${mission.fame} fame.`]
    };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EVENT FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const triggerRandomEvent = (state) => {
    // Filter events based on conditions
    const availableEvents = RANDOM_EVENTS.filter(event => {
      if (!event.condition) return true;
      return event.condition(state);
    });

    if (availableEvents.length === 0) return null;

    // Randomly select an event
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    return { ...event };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  COMBAT FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const getNPCAction = (enemy) => {
    const roll = Math.random();
    if (roll < 0.6) return "broadside";
    if (roll < 0.8) return "precision";
    return "grapple";
  };

const resolveCombatAction = (state, action) => {
  if (!state.battleState) {
    return {
      player: { hullDamage: 0, crewLoss: 0 },
      enemy: { hullDamage: 0, crewLoss: 0 },
      moraleDelta: 0,
      fled: false,
      instantVictory: false,
      goldReward: 0
    };
  }

  const shipStats = getShipStats(state);
  const { battleState } = state;
  const { enemy } = battleState;

  const outcome = {
    player: { hullDamage: 0, crewLoss: 0 },
    enemy: { hullDamage: 0, crewLoss: 0 },
    moraleDelta: 0,
    fled: false,
    instantVictory: false,
    goldReward: 0
  };

  // Helper: apply 50% chance to avoid crew loss
  const maybeCrewLoss = (amount) => Math.random() < 0.5 ? 0 : Math.floor(amount);

  // --- Player Action ---
  switch (action) {
    case "broadside": {
      const dmg = shipStats.cannons * (0.8 + Math.random() * 0.4);
      outcome.player.hullDamage = Math.floor(dmg * 0.6);
      outcome.player.crewLoss = maybeCrewLoss(dmg * 0.4 / 3);   // /3 instead of /10, 50% skip
      break;
    }
    case "precision": {
      if (Math.random() < 0.7) {
        const dmg = shipStats.cannons * (1.2 + Math.random() * 0.6);
        outcome.player.hullDamage = Math.floor(dmg * 0.9);
        outcome.player.crewLoss = maybeCrewLoss(dmg * 0.1 / 3);
      }
      break;
    }
    case "grapple": {
      const playerCrew = state.crew.current;
      const enemyCrew = enemy.crew;
      const playerHullPct = state.ship.hull / shipStats.maxHull;
      const playerMoralePct = state.crew.morale / 100;

      let successChance = 0.5;
      const crewDiff = playerCrew - enemyCrew;
      successChance += Math.min(0.3, Math.max(0, crewDiff / enemyCrew * 0.3));
      successChance += Math.min(0.2, Math.max(0, (playerMoralePct - 0.5) * 0.4));
      successChance += Math.min(0.2, Math.max(0, (playerHullPct - 0.5) * 0.4));
      successChance = Math.min(0.95, successChance);

      if (Math.random() < successChance) {
        outcome.instantVictory = true;
      } else {
        // Player grapple failure → player loses crew
        const crewLossPct = 0.3 + Math.random() * 0.2;
        outcome.enemy.crewLoss = Math.floor(playerCrew * crewLossPct);   // fixed: was outcome.player
      }
      break;
    }
    case "evade": {
      if (Math.random() < 0.9) {
        outcome.fled = true;
      } else {
        // Evade fail: take reduced enemy fire
        const enemyDmg = enemy.cannons * (0.8 + Math.random() * 0.4);
        outcome.player.hullDamage = Math.floor(enemyDmg * 0.3);
        outcome.player.crewLoss = maybeCrewLoss(enemyDmg * 0.2 / 3);
      }
      break;
    }
  }

  // --- Determine morale delta based on battle-ending outcome ---
  if (outcome.instantVictory) {
    outcome.moraleDelta = 5;
  } else if (outcome.fled) {
    outcome.moraleDelta = -5;
  } else {
    const newEnemyHull = Math.max(0, battleState.enemyHull - outcome.player.hullDamage);
    if (newEnemyHull <= 0) {
      outcome.moraleDelta = 10;
    } else if (action === "grapple") {
      outcome.moraleDelta = -10;
    }
  }

  // Gold reward: only for grapple victory
  if (outcome.instantVictory) {
    outcome.goldReward = Math.floor((enemy.hull + enemy.cannons * 10 + enemy.crew * 5) * 0.3);
  }

  // --- NPC Action (damage only, no morale) ---
  if (!outcome.fled && !outcome.instantVictory) {
    const npcAction = getNPCAction(enemy);
    const npcDmg = enemy.cannons * (0.7 + Math.random() * 0.3);

    switch (npcAction) {
      case "broadside": {
        outcome.enemy.hullDamage = Math.floor(npcDmg * 0.6);
        outcome.enemy.crewLoss = maybeCrewLoss(npcDmg * 0.4 / 3);   // /3, 50% skip
        break;
      }
      case "precision": {
        if (Math.random() < 0.7) {
          outcome.enemy.hullDamage = Math.floor(npcDmg * 0.9);
          outcome.enemy.crewLoss = maybeCrewLoss(npcDmg * 0.1 / 3);
        }
        break;
      }
      case "grapple": {
        const enemyCrew = enemy.crew;
        const playerCrew = state.crew.current;
        const enemyHullPct = battleState.enemyHull / enemy.hull;
        const enemyMoralePct = 0.7;

        let npcSuccessChance = 0.5;
        const npcCrewDiff = enemyCrew - playerCrew;
        npcSuccessChance += Math.min(0.3, Math.max(0, npcCrewDiff / playerCrew * 0.3));
        npcSuccessChance += Math.min(0.2, Math.max(0, (enemyHullPct - 0.5) * 0.4));
        npcSuccessChance += Math.min(0.2, 0.7 - 0.5 * 0.4);
        npcSuccessChance = Math.min(0.95, npcSuccessChance);

        if (Math.random() < npcSuccessChance) {
          // NPC grapple success → player loses crew
          const npcCrewLossPct = 0.3 + Math.random() * 0.2;
          outcome.enemy.crewLoss += Math.floor(playerCrew * npcCrewLossPct);   // fixed
        } else {
          // NPC grapple failure → enemy loses crew
          const npcCrewLoss = Math.floor(enemyCrew * 0.05);
          outcome.player.crewLoss += npcCrewLoss;                              // fixed
        }
        break;
      }
      case "evade": {
        if (Math.random() < 0.9) {
          // NPC flees
        } else {
          outcome.enemy.hullDamage += outcome.player.hullDamage;
          outcome.enemy.crewLoss += outcome.player.crewLoss;
        }
        break;
      }
    }
  }

  // Apply morale modifier to player damage
  const effectiveMorale = getEffectiveMorale(state);
  const moraleModifier = effectiveMorale < 30 ? 1.2 : (effectiveMorale > 70 ? 0.9 : 1);
  outcome.player.hullDamage = Math.floor(outcome.player.hullDamage * moraleModifier);
  outcome.player.crewLoss = Math.floor(outcome.player.crewLoss * moraleModifier);

  return outcome;
};

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  INITIALIZATION FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const initializeReputation = () => {
    const reputation = {};
    Object.keys(PORTS).forEach(port => {
      reputation[port] = 50; // Start neutral with all ports
    });
    return reputation;
  };

  const getStartingShip = (bonuses) => {
    const shipBonus = bonuses.find(b => b.startsWith("ship:"));
    if (shipBonus) {
      const shipType = shipBonus.split(":")[1].trim();
      const ship = SHIPS[shipType];
      return {
        type: shipType,
        name: ship.name,
        hull: ship.maxHull,
        cannons: ship.cannons,
        upgrades: []
      };
    }
    // Default to sloop
    return {
      type: "sloop",
      name: "Sea Dog",
      hull: SHIPS.sloop.maxHull,
      cannons: SHIPS.sloop.cannons,
      upgrades: []
    };
  };

  const getStartingCrew = (ship, bonuses) => {
    const shipStats = SHIPS[ship.type];
    const crewBonus = bonuses.find(b => b.includes("crew"));
    let current = Math.floor(shipStats.maxCrew * 0.6); // Start with 60% crew
    if (crewBonus) {
      current = Math.min(shipStats.maxCrew, current + parseInt(crewBonus));
    }
    return {
      current,
      max: shipStats.maxCrew,
      morale: 80
    };
  };

  const getStartingGold = (bonuses) => {
    let gold = 1000;
    bonuses.forEach(bonus => {
      if (bonus.startsWith("+")) {
        const amount = parseInt(bonus.substring(1).replace(/[^0-9]/g, ""));
        gold += amount;
      }
    });
    return gold;
  };

  const getStartingReputation = (bonuses) => {
    const reputation = initializeReputation();
    bonuses.forEach(bonus => {
      const repMatch = bonus.match(/([+-]\d+) reputation with (\w+)/i);
      if (repMatch) {
        const delta = parseInt(repMatch[1]);
        const faction = repMatch[2].toLowerCase();
        Object.keys(PORTS).forEach(port => {
          if (PORTS[port].faction === faction) {
            reputation[port] = Math.max(0, Math.min(100, reputation[port] + delta));
          }
        });
      }
    });
    return reputation;
  };

  // Expose all functions globally
  return {
    // Save/Load
    hasSave,
    saveGame,
    loadGame,

    // Helpers
    canAfford,
    reputationLabel,
    hasUpgrade,
    getShipStats,
    getEffectiveMorale,

    // Ship/Repair
    shipRepairCost,

    // Travel
    travelDays,

    // Reputation
    decayReputation,
    updateReputation,
    applyReputationImpact,

    // Crew
    payCrewWages,

    // Missions
    generateMissions,
    completeMissionOnCombatVictory,

    // Events
    triggerRandomEvent,

    // Combat
    getNPCAction,
    resolveCombatAction,

    // Initialization
    initializeReputation,
    getStartingShip,
    getStartingCrew,
    getStartingGold,
    getStartingReputation
  };
})();