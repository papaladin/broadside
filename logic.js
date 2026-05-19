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

  const getFameLabel = (fame) => {
  if (fame >= 350) return "Immortal";
  if (fame >= 200) return "Legendary";
  if (fame >= 100) return "Notorious";
  if (fame >= 50)  return "Recognised";
  return "Unknown";
  };

  const getFameTier = (fame) => {
  if (fame >= 350) return 4;
  if (fame >= 200) return 3;
  if (fame >= 100) return 2;
  if (fame >= 50)  return 1;
  return 0;
};

  const getInfamyLabel = (infamy) => {
  if (infamy >= 100) return "Legendary Outlaw";
  if (infamy >= 50)  return "Notorious";
  if (infamy >= 25)  return "Wanted";
  if (infamy >= 10)  return "Suspect";
  return "Clean";
  };

  const hasUpgrade = (state, upgradeKey) => {
    return state.ship.upgrades.includes(upgradeKey);
  };

  const meetsRequirement = (state, item) => {
  if (item.requiredFame && state.fame < item.requiredFame)
    return { allowed: false, reason: `Requires ★ ${item.requiredFame} fame (${getFameLabel(item.requiredFame)})` };
  return { allowed: true, reason: null };
  };

  const canBribe = (state) => (state.infamy ?? 0) < 50;


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

  const getRepPerk = (rep) => {
    if (rep >= 80) return { tier: "allied",   repairMult: 0.80, missionMult: 1.20, servicesBlocked: false };
    if (rep >= 50) return { tier: "friendly", repairMult: 0.90, missionMult: 1.10, servicesBlocked: false };
    if (rep >= 30) return { tier: "neutral",  repairMult: 1.00, missionMult: 0.90, servicesBlocked: false };
    if (rep >= 10) return { tier: "hostile",  repairMult: 1.00, missionMult: 0.75, servicesBlocked: false };
    return               { tier: "at_war",   repairMult: 1.00, missionMult: 0,    servicesBlocked: true  };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CREW FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const payCrewWages = (state) => {
    const effectiveMorale = getEffectiveMorale(state);
    const wageMultiplier = effectiveMorale < 30 ? 1.5 : 1;
    const wages = Math.floor(state.crew.roster.length * 2 * wageMultiplier);
    return wages;
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
    if (roll < 0.7) return "broadside";
    if (roll < 0.95) return "precision";
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
      const playerCrew = state.crew.roster.length;
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
        const playerCrew = state.crew.roster.length;
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

//--------------------------------------
// ---  encounter context & pre-screen ---
//--------------------------------------



  // Simple dice roller (1 .. sides)
  const roll = (sides) => Math.ceil(Math.random() * sides);

  // Derive a ship type from enemy stats (for speed display / flee checks)
  const guessShipType = (enemy) => {
    if (!enemy) return "sloop";
    const cannons = enemy.cannons || 0;
    if (cannons >= 25) return "galleon";
    if (cannons >= 18) return "frigate";
    if (cannons >= 12) return "brigantine";
    return "sloop";
  };

  function buildEncounterContext(state, type, enemy) {
    const { ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE, SHIPS } = window.D;

    const shipStats  = getShipStats(state);
    const mySpeed    = shipStats.speed;
    const enemyShip  = guessShipType(enemy);
    const eSpeed     = SHIPS[enemyShip]?.speed ?? 5;
    const rep        = state.reputation[state.destination ?? state.currentPort] ?? 20;
    const gold       = state.gold;
    const bribeCost  = Math.round((enemy.gold ?? 500) * 0.4);

    // --- Flee ---
    const noFleeTypes = ["hostile_port_entry", "bounty_target", "mission_combat"];
    const canFlee     = !noFleeTypes.includes(type);
    const fleeReason  = !canFlee
      ? type === "hostile_port_entry"
        ? "Already in range of the harbour guns"
        : "The target is cornered — no escape"
      : null;

    // --- Parley ---
    const noParleyTypes = [
      "hostile_port_entry", "bounty_target", "mission_combat",
      "smuggling_caught", "cargo_inspection_refused"
    ];
    const canParley   = !noParleyTypes.includes(type) && rep >= 30;
    const parleyReason = noParleyTypes.includes(type)
      ? "They are not here to negotiate"
      : rep < 30
        ? `Reputation too low (${rep} — need 30)`
        : null;

    // --- Bribe ---
    const noBribeTypes = ["hostile_port_entry", "bounty_target", "mission_combat"];
    const bribeBlocked = noBribeTypes.includes(type);
    const canAffordBribe = gold >= bribeCost;
    const bribeInfamyBlocked = !L.canBribe(state);
    const canBribeResult = !bribeBlocked && canAffordBribe && !bribeInfamyBlocked;
    const bribeReason = bribeBlocked        ? "They cannot be bought"
                      : bribeInfamyBlocked  ? "Your reputation for bribery has preceded you."
                      : !canAffordBribe     ? `Need ${bribeCost}g (you have ${gold}g)`
                      : null;

    // --- Surrender ---
    const noSurrenderTypes = ["bounty_target", "mission_combat"];
    const canSurrender = !noSurrenderTypes.includes(type);
    const surrenderReason = !canSurrender
      ? "Surrender means death here"
      : null;

    return {
      type,
      enemy: { ...enemy, ship: enemyShip },   // attach ship type for UI
      flavourText: ENCOUNTER_FLAVOUR[type]?.(enemy, rep)
        ?? `A ${enemy.name} moves to intercept.`,
      options: {
        flee: {
          available:   canFlee,
          reason:      fleeReason,
          speedCheck:  canFlee ? { player: mySpeed, enemy: eSpeed } : null,
        },
        parley: {
          available:   canParley,
          reason:      parleyReason,
          repRequired: 30,
        },
        bribe: {
          available:   canBribeResult,   // was canBribe
          reason:      bribeReason,
          cost:        bribeCost,
        },
        surrender: {
          available:    canSurrender,
          reason:       surrenderReason,
          consequence:  SURRENDER_CONSEQUENCE[type] ?? SURRENDER_CONSEQUENCE.random,
        },
        fight: {
          available: true,
          reason:    null,
        },
      },
    };
  }


  // Create a full roster
  const generateRoster = (count, faction = "pirate") => {
    const roster = [];
    const existingNames = [];
    for (let i = 0; i < count; i++) {
      const member = generateCrewMember(faction, existingNames);
      roster.push(member);
      existingNames.push(`${member.firstName} ${member.lastName}`);
    }
    return roster;
  };

  // Remove random members and return the removed list
  const removeRandomCrew = (roster, count) => {
    if (count <= 0) return { newRoster: [...roster], removed: [] };
    const shuffled = [...roster].sort(() => Math.random() - 0.5);
    const removed = shuffled.slice(0, count);
    const removedIds = new Set(removed.map(m => m.id));
    const newRoster = roster.filter(m => !removedIds.has(m.id));
    return { newRoster, removed };
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
    getFameLabel,
    getFameTier,
    getInfamyLabel,
    meetsRequirement,
    canBribe,
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
    getRepPerk,

    // Crew
    payCrewWages,
    removeRandomCrew,

    // Events
    triggerRandomEvent,

    //encounter
    buildEncounterContext,
    roll,

    // Combat
    getNPCAction,
    resolveCombatAction,
    completeMissionOnCombatVictory,

    // Initialization
    initializeReputation,
    getStartingShip,
    getStartingCrew,
    getStartingGold,
    getStartingReputation

  };
})();