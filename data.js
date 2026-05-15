// ═══════════════════════════════════════════════════════════════════
//  data.js — ALL GAME CONSTANTS (FULLY UPDATED WITH COMBAT MISSIONS)
//  No logic, no functions. Pure data.
//  Exposed as window.D for global access.
// ═══════════════════════════════════════════════════════════════════

window.D = (() => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PORTS: All ports in the Caribbean.
  //  x, y: Coordinates for the map (0-760, 0-460).
  //  faction: Key in FACTIONS.
  //  services: Available services (shipyard, missions, crew, upgrades).
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const PORTS = {
    port_royal: {
      name: "Port Royal",
      x: 650, y: 300,
      faction: "english",
      services: ["shipyard", "missions", "crew", "upgrades"],
      desc: "Bustling English port with a thriving market and strict laws. The heart of British trade in the Caribbean."
    },
    kingston: {
      name: "Kingston",
      x: 700, y: 350,
      faction: "english",
      services: ["shipyard", "missions", "crew"],
      desc: "A well-defended English port. Home to the Royal Navy's Caribbean fleet."
    },
    havana: {
      name: "Havana",
      x: 50, y: 100,
      faction: "spanish",
      services: ["shipyard", "missions", "crew", "upgrades"],
      desc: "The jewel of the Spanish Empire. Heavily fortified and rich with gold from the New World."
    },
    cartagena: {
      name: "Cartagena",
      x: 100, y: 50,
      faction: "spanish",
      services: ["shipyard", "missions", "crew"],
      desc: "A major Spanish port with towering walls. A hub for treasure fleets."
    },
    tortuga: {
      name: "Tortuga",
      x: 200, y: 200,
      faction: "pirate",
      services: ["missions", "crew"],
      desc: "Lawless pirate haven. No questions asked, but no shipyards either."
    },
    nassau: {
      name: "Nassau",
      x: 300, y: 250,
      faction: "pirate",
      services: ["missions", "crew", "upgrades"],
      desc: "The Republic of Pirates. A free port for those who dare to live outside the law."
    },
    maracaibo: {
      name: "Maracaibo",
      x: 150, y: 300,
      faction: "spanish",
      services: ["missions", "crew"],
      desc: "A wealthy Spanish port, but its shallow waters make it vulnerable to raids."
    },
    port_de_paix: {
      name: "Port-de-Paix",
      x: 400, y: 150,
      faction: "french",
      services: ["shipyard", "missions", "crew"],
      desc: "A French port known for its sugar plantations and privateers."
    },
    martinique: {
      name: "Martinique",
      x: 500, y: 100,
      faction: "french",
      services: ["missions", "crew"],
      desc: "A French island with a small but strategic port."
    },
    curacao: {
      name: "Curaçao",
      x: 250, y: 50,
      faction: "dutch",
      services: ["shipyard", "missions", "crew"],
      desc: "A Dutch trading post. Neutral ground for merchants of all nations."
    },
    st_eustatius: {
      name: "St. Eustatius",
      x: 450, y: 200,
      faction: "dutch",
      services: ["missions", "crew"],
      desc: "A small but prosperous Dutch island. Known as the 'Golden Rock' for its trade."
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SHIPS: Player and enemy ship types.
  //  maxHull: Maximum hull HP.
  //  maxCrew: Maximum crew capacity.
  //  cannons: Number of cannons.
  //  speed: Sailing speed (higher = faster).
  //  cost: Gold cost to purchase.
  //  upgradeable: Array of upgrade keys from UPGRADES.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const SHIPS = {
    dinghy: {
      name: "Dinghy",
      maxHull: 30,
      maxCrew: 5,
      cannons: 2,
      speed: 3,
      cost: 200,
      upgradeable: [],
      desc: "A tiny boat. Barely seaworthy, but cheap."
    },
    sloop: {
      name: "Sloop",
      maxHull: 100,
      maxCrew: 50,
      cannons: 10,
      speed: 8,
      cost: 1000,
      upgradeable: ["reinforced_hull", "extra_cannons"],
      desc: "Fast and maneuverable. Ideal for hit-and-run tactics."
    },
    brigantine: {
      name: "Brigantine",
      maxHull: 150,
      maxCrew: 80,
      cannons: 15,
      speed: 6,
      cost: 2500,
      upgradeable: ["reinforced_hull", "extra_cannons", "figurehead"],
      desc: "Balanced ship with good speed and firepower."
    },
    frigate: {
      name: "Frigate",
      maxHull: 200,
      maxCrew: 100,
      cannons: 20,
      speed: 5,
      cost: 4000,
      upgradeable: ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"],
      desc: "A warship. Slow but heavily armed."
    },
    galleon: {
      name: "Galleon",
      maxHull: 300,
      maxCrew: 150,
      cannons: 30,
      speed: 3,
      cost: 8000,
      upgradeable: ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"],
      desc: "The king of the seas. Slow but nearly unstoppable in combat."
    },
    merchantman: {
      name: "Merchantman",
      maxHull: 120,
      maxCrew: 60,
      cannons: 5,
      speed: 4,
      cost: 1500,
      upgradeable: ["reinforced_hull"],
      desc: "Built for trade, not combat. Large cargo hold, but weak in a fight."
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  FACTIONS: Political factions in the Caribbean.
  //  label: Display name.
  //  color: Primary color (for UI).
  //  rivalFactions: Array of faction keys that are rivals.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const FACTIONS = {
    english: {
      label: "English",
      color: "#ff0000",
      rivalFactions: ["spanish", "french"]
    },
    spanish: {
      label: "Spanish",
      color: "#ffcc00",
      rivalFactions: ["english", "dutch"]
    },
    french: {
      label: "French",
      color: "#0066ff",
      rivalFactions: ["english", "spanish"]
    },
    dutch: {
      label: "Dutch",
      color: "#ff6600",
      rivalFactions: ["spanish"]
    },
    pirate: {
      label: "Pirate",
      color: "#800080",
      rivalFactions: ["english", "spanish", "french", "dutch"]
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  UPGRADES: Ship upgrades.
  //  name: Display name.
  //  desc: Description.
  //  cost: Gold cost.
  //  effects: Object with stat bonuses (e.g., { hullBonus: 0.2 }).
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const UPGRADES = {
    reinforced_hull: {
      name: "Reinforced Hull",
      desc: "+20% hull HP",
      cost: 500,
      effects: { hullBonus: 0.2 }
    },
    extra_cannons: {
      name: "Extra Cannons",
      desc: "+2 cannons",
      cost: 800,
      effects: { cannonBonus: 2 }
    },
    figurehead: {
      name: "Ornate Figurehead",
      desc: "+5% crew morale (max +15%)",
      cost: 300,
      effects: { moraleBonus: 5 }
    },
    copper_hull: {
      name: "Copper-Plated Hull",
      desc: "-1 day travel time (wind resistance)",
      cost: 1200,
      effects: { speedBonus: 1 }
    },
    navigational_tools: {
      name: "Navigational Tools",
      desc: "-1 day travel time (better routing)",
      cost: 600,
      effects: { speedBonus: 1 }
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  MISSION_POOL: All possible missions.
  //  targetPort: Port key where mission is completed (null for instant combat).
  //  type: "trade", "escort", "combat", "smuggle", "assault".
  //  gold: Gold reward.
  //  fame: Fame points.
  //  risk: "low", "medium", or "high".
  //  faction: Faction offering the mission.
  //  repImpact: Object with faction reputation changes.
  //  enemy: Enemy ship definition (for combat/smuggle/assault missions).
  //  interceptChance: Probability of combat during voyage (for smuggle missions).
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const MISSION_POOL = [
    // ===== TRADE MISSIONS =====
    {
      id: "trade_spices",
      name: "Deliver Spices",
      desc: "Transport a shipment of spices to Havana.",
      targetPort: "havana",
      type: "trade",
      gold: 500,
      fame: 10,
      risk: "low",
      faction: "spanish",
      repImpact: { spanish: +15, english: -5 }
    },
    {
      id: "trade_sugar",
      name: "Deliver Sugar",
      desc: "Take sugar from Port-de-Paix to Kingston.",
      targetPort: "kingston",
      type: "trade",
      gold: 600,
      fame: 10,
      risk: "low",
      faction: "french",
      repImpact: { french: +15, english: +5 }
    },
    {
      id: "trade_gold",
      name: "Transport Gold",
      desc: "Escort a gold shipment to Cartagena.",
      targetPort: "cartagena",
      type: "trade",
      gold: 800,
      fame: 15,
      risk: "medium",
      faction: "spanish",
      repImpact: { spanish: +20, pirate: -10 }
    },

    // ===== ESCORT MISSIONS =====
    {
      id: "escort_merchant",
      name: "Escort Merchant Ship",
      desc: "Protect a merchant ship from pirates on its way to Curaçao.",
      targetPort: "curacao",
      type: "escort",
      gold: 1000,
      fame: 20,
      risk: "medium",
      faction: "dutch",
      repImpact: { dutch: +20, pirate: -15 }
    },
    {
      id: "escort_fleet",
      name: "Escort Treasure Fleet",
      desc: "Defend a Spanish treasure fleet from English privateers.",
      targetPort: "havana",
      type: "escort",
      gold: 1500,
      fame: 30,
      risk: "high",
      faction: "spanish",
      repImpact: { spanish: +30, english: -20 }
    },

    // ===== COMBAT MISSIONS (Instant Combat) =====
    {
      id: "hunt_pirate",
      name: "Hunt the Pirate Scourge",
      desc: "Sink the notorious pirate 'Black Bart' and his crew.",
      targetPort: null,
      type: "combat",
      gold: 2000,
      fame: 50,
      risk: "high",
      faction: "english",
      repImpact: { english: +30, pirate: -20 },
      enemy: {
        name: "Black Bart's Revenge",
        hull: 150,
        cannons: 15,
        crew: 40,
        faction: "pirate"
      }
    },
    {
      id: "hunt_privateer",
      name: "Hunt French Privateer",
      desc: "Track down and sink the French privateer 'Le Renard'.",
      targetPort: null,
      type: "combat",
      gold: 1800,
      fame: 40,
      risk: "high",
      faction: "english",
      repImpact: { english: +25, french: -20 },
      enemy: {
        name: "Le Renard",
        hull: 130,
        cannons: 12,
        crew: 35,
        faction: "french"
      }
    },
    {
      id: "debug_combat",
      name: "DEBUG: Force Combat",
      desc: "Immediately triggers a test battle. For debugging only.",
      targetPort: null,
      type: "combat",
      gold: 0,
      fame: 0,
      risk: "low",
      faction: "pirate",
      repImpact: {},
      enemy: {
        name: "Test Pirate",
        hull: 100,
        cannons: 10,
        crew: 40,
        faction: "pirate"
      }
    },

    // ===== SMUGGLE MISSIONS (Random Combat During Voyage) =====
    {
      id: "smuggle_goods",
      name: "Smuggle Contraband",
      desc: "Smuggle goods past the English blockade to Tortuga.",
      targetPort: "tortuga",
      type: "smuggle",
      gold: 1200,
      fame: 25,
      risk: "high",
      faction: "pirate",
      repImpact: { pirate: +20, english: -15 },
      enemy: {
        name: "English Blockade",
        hull: 120,
        cannons: 12,
        crew: 35,
        faction: "english"
      },
      interceptChance: 0.7 // 70% chance of combat during voyage
    },
    {
      id: "smuggle_slaves",
      name: "Smuggle Slaves",
      desc: "Transport slaves from Africa to Maracaibo. (Disreputable work.)",
      targetPort: "maracaibo",
      type: "smuggle",
      gold: 3000,
      fame: 0,
      risk: "high",
      faction: "pirate",
      repImpact: { pirate: +10, spanish: -30, english: -20, french: -20, dutch: -20 },
      enemy: {
        name: "Spanish Patrol",
        hull: 140,
        cannons: 14,
        crew: 45,
        faction: "spanish"
      },
      interceptChance: 0.8 // 80% chance of combat
    },
    {
      id: "smuggle_rum",
      name: "Smuggle Rum to Nassau",
      desc: "Deliver rum to the pirates of Nassau under the nose of the Navy.",
      targetPort: "nassau",
      type: "smuggle",
      gold: 800,
      fame: 15,
      risk: "medium",
      faction: "pirate",
      repImpact: { pirate: +15, english: -10 },
      enemy: {
        name: "Navy Sloop",
        hull: 100,
        cannons: 10,
        crew: 30,
        faction: "english"
      },
      interceptChance: 0.5 // 50% chance of combat
    },

    // ===== ASSAULT MISSIONS (Combat on Arrival) =====
    {
      id: "assault_havana",
      name: "Assault Spanish Outpost",
      desc: "Attack and capture the Spanish outpost at Havana!",
      targetPort: "havana",
      type: "assault",
      gold: 3000,
      fame: 100,
      risk: "high",
      faction: "pirate",
      repImpact: { pirate: +30, spanish: -40 },
      enemy: {
        name: "Havana Guards",
        hull: 200,
        cannons: 20,
        crew: 50,
        faction: "spanish"
      }
    },
    {
      id: "assault_cartagena",
      name: "Raid Cartagena",
      desc: "Launch a surprise attack on the Spanish stronghold at Cartagena.",
      targetPort: "cartagena",
      type: "assault",
      gold: 4000,
      fame: 120,
      risk: "high",
      faction: "pirate",
      repImpact: { pirate: +35, spanish: -50 },
      enemy: {
        name: "Cartagena Garrison",
        hull: 250,
        cannons: 25,
        crew: 60,
        faction: "spanish"
      }
    },
    {
      id: "assault_port_royal",
      name: "Strike at Port Royal",
      desc: "Dare to attack the heart of English power in the Caribbean.",
      targetPort: "port_royal",
      type: "assault",
      gold: 5000,
      fame: 150,
      risk: "high",
      faction: "pirate",
      repImpact: { pirate: +40, english: -50 },
      enemy: {
        name: "Port Royal Garrison",
        hull: 300,
        cannons: 30,
        crew: 70,
        faction: "english"
      }
    },

    // ===== PATROL MISSIONS =====
    {
      id: "patrol_waters",
      name: "Patrol the Waters",
      desc: "Patrol the waters around Port Royal for pirate activity.",
      targetPort: "port_royal",
      type: "patrol",
      gold: 800,
      fame: 15,
      risk: "medium",
      faction: "english",
      repImpact: { english: +20, pirate: -10 }
    }
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  RANDOM_EVENTS: Events that can occur at sea or in port.
  //  type: "hazard", "choice", "reward", "crew", or "faction".
  //  choices: Array of { label: string, outcome: object }.
  //  outcome: Can include log, gold, fame, hullDamage, crewLoss, daysLost, repImpact, battle, etc.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const RANDOM_EVENTS = [
    // Hazards
    {
      id: "storm",
      type: "hazard",
      title: "Violent Storm!",
      desc: "A storm batters your ship for days. The waves are relentless.",
      choices: [
        {
          label: "Brace for impact",
          outcome: {
            log: "The storm rages on! Your ship takes damage.",
            hullDamage: 15,
            daysLost: 2,
            crewLoss: 2
          }
        }
      ]
    },
    {
      id: "calm_winds",
      type: "hazard",
      title: "Doldrums",
      desc: "The winds die down, leaving your ship becalmed.",
      choices: [
        {
          label: "Wait it out",
          outcome: {
            log: "You drift for days with no wind.",
            daysLost: 3
          }
        }
      ]
    },

    // Choice events
    {
      id: "merchant_distress",
      type: "choice",
      title: "Merchant in Distress",
      desc: "A merchant ship is under attack by pirates!",
      choices: [
        {
          label: "Help the merchant",
          outcome: {
            log: "You fend off the pirates! The merchant rewards you.",
            gold: 200,
            repImpact: { spanish: +10 },
            hullDamage: 5
          }
        },
        {
          label: "Ignore them",
          outcome: {
            log: "You sail past. The merchant curses your name.",
            repImpact: { spanish: -10 }
          }
        },
        {
          label: "Join the pirates",
          outcome: {
            log: "You side with the pirates and plunder the merchant!",
            gold: 400,
            repImpact: { spanish: -20, pirate: +15 },
            hullDamage: 10
          }
        }
      ]
    },
    {
      id: "shipwreck",
      type: "choice",
      title: "Shipwreck Spotted",
      desc: "You spot a wrecked ship floating in the water.",
      choices: [
        {
          label: "Loot the wreck",
          outcome: {
            log: "You find some gold and supplies in the wreckage.",
            gold: 300
          }
        },
        {
          label: "Ignore it",
          outcome: {
            log: "You leave the wreck behind."
          }
        }
      ]
    },

    // Reward events
    {
      id: "treasure_map",
      type: "reward",
      title: "Treasure Map Found!",
      desc: "You discover a map leading to buried treasure.",
      choices: [
        {
          label: "Follow the map",
          outcome: {
            log: "After 2 days of searching, you find the treasure!",
            gold: 1000,
            daysLost: 2
          }
        },
        {
          label: "Sell the map",
          outcome: {
            log: "You sell the map to a collector in the next port.",
            gold: 200
          }
        }
      ]
    },
    {
      id: "whale_sighting",
      type: "reward",
      title: "Whale Sighting",
      desc: "A pod of whales surfaces near your ship. A good omen!",
      choices: [
        {
          label: "Harvest the whales",
          outcome: {
            log: "You harvest whale oil to sell in port.",
            gold: 500,
            crewLoss: 5
          }
        },
        {
          label: "Leave them be",
          outcome: {
            log: "You leave the whales in peace. The crew appreciates your mercy.",
            moraleBonus: 5
          }
        }
      ]
    },

    // Crew events
    {
      id: "mutiny",
      type: "crew",
      title: "Mutiny!",
      desc: "Your crew revolts due to low morale and harsh conditions!",
      choices: [
        {
          label: "Negotiate",
          outcome: {
            log: "You promise better conditions. The crew stands down... for now.",
            gold: -200,
            moraleBonus: 20
          }
        },
        {
          label: "Crush the mutiny",
          outcome: {
            log: "You put down the mutiny with force.",
            crewLoss: 10,
            moraleBonus: -15
          }
        }
      ],
      condition: (state) => state.crew.morale < 20
    },
    {
      id: "deserters",
      type: "crew",
      title: "Deserters",
      desc: "Some of your crew abandon ship in the night.",
      choices: [
        {
          label: "Let them go",
          outcome: {
            log: "The deserters leave without incident.",
            crewLoss: 5
          }
        },
        {
          label: "Punish them",
          outcome: {
            log: "You make an example of one deserter. The rest think twice.",
            crewLoss: 1,
            moraleBonus: -10
          }
        }
      ],
      condition: (state) => state.crew.morale < 40
    },

    // Faction events
    {
      id: "navy_patrol",
      type: "faction",
      title: "Navy Patrol!",
      desc: "A naval patrol from a nearby power demands to inspect your ship.",
      choices: [
        {
          label: "Allow inspection",
          outcome: {
            log: "The patrol finds nothing illegal. They let you pass.",
            repImpact: { english: +5 }
          }
        },
        {
          label: "Refuse inspection",
          outcome: {
            log: "The patrol takes offense and attacks!",
            battle: {
              enemy: {
                name: "Navy Patrol",
                hull: 120,
                cannons: 12,
                crew: 40,
                faction: "english"
              }
            }
          }
        }
      ],
      condition: (state) => state.reputation[state.currentPort] > 30
    }
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  STARTS: Starting scenarios for new games.
  //  bonuses: Array of starting bonuses (e.g., "+2000 gold", "ship: frigate").
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const STARTS = [
    {
      id: "merchant",
      name: "Merchant Captain",
      desc: "Start with extra gold and a trade-focused ship. Ideal for peaceful traders.",
      bonuses: ["+2000 gold", "ship: merchantman"]
    },
    {
      id: "privateer",
      name: "Privateer",
      desc: "Start with a letter of marque and a fast ship. Hunt enemies of your nation for profit.",
      bonuses: ["+10 reputation with English", "ship: sloop", "+500 gold"]
    },
    {
      id: "pirate",
      name: "Pirate King",
      desc: "Start with a fearsome reputation and a crew of cutthroats. The sea is yours to plunder.",
      bonuses: ["ship: brigantine", "+20 reputation with Pirate", "+1000 gold"]
    },
    {
      id: "admiral",
      name: "Naval Admiral",
      desc: "Start with a powerful warship and the respect of the navy. Serve your nation with honor.",
      bonuses: ["ship: frigate", "+30 reputation with English", "+1500 gold"]
    },
    {
      id: "smuggler",
      name: "Smuggler",
      desc: "Start with a small, fast ship and a knack for avoiding the law.",
      bonuses: ["ship: sloop", "+1000 gold", "+15 reputation with Dutch"]
    }
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  FACTION_RELATIONS: Predefined relationships between factions.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const FACTION_RELATIONS = {
    english: {
      spanish: -1,
      french: -1,
      dutch: 0,
      pirate: -1
    },
    spanish: {
      english: -1,
      french: -1,
      dutch: -1,
      pirate: -1
    },
    french: {
      english: -1,
      spanish: -1,
      dutch: 0,
      pirate: -1
    },
    dutch: {
      english: 0,
      spanish: -1,
      french: 0,
      pirate: 0
    },
    pirate: {
      english: -1,
      spanish: -1,
      french: -1,
      dutch: 0
    }
  };

  const ENCOUNTER_FLAVOUR = {
    patrol: (enemy, rep) => rep < 20
      ? `A ${enemy.name} opens fire without warning.`
      : `A ${enemy.name} hails you and demands you heave to for inspection.`,

    hostile_port_entry: (enemy) =>
      `The harbour battery opens fire. You sailed into hostile waters.`,

    smuggling_caught: () =>
      `"Heave to for inspection!" The patrol has spotted your cargo hold.`,

    cargo_inspection_refused: () =>
      `The patrol vessel moves to enforce compliance. You have seconds to decide.`,

    bounty_target: (enemy) =>
      `You've cornered ${enemy.name}. There is nowhere left to run.`,

    named_rival: (enemy) =>
      `${enemy.name}'s ship emerges from the fog. This was no accident.`,

    mission_combat: (enemy) =>
      `Your target is in sight: ${enemy.name}. The mission requires engagement.`,

    random: (enemy) =>
      `A ${enemy.name} moves to intercept. They haven't fired yet.`,
  };

  const SURRENDER_CONSEQUENCE = {
    patrol:                   { loseCargoPercent: 30, moralePenalty: 10 },
    smuggling_caught:         { loseContraband: true, goldFine: 200,  moralePenalty: 8 },
    cargo_inspection_refused: { loseContraband: true, goldFine: 150,  moralePenalty: 6 },
    hostile_port_entry:       { imprisoned: true, loseDays: 5, loseGoldPercent: 30, moralePenalty: 20 },
    named_rival:              { loseGoldPercent: 40, moralePenalty: 25, rep_loss: 10 },
    random:                   { loseCargoPercent: 20, moralePenalty: 8 },
  };


  // Expose all constants globally
  return {
    PORTS,
    SHIPS,
    FACTIONS,
    UPGRADES,
    MISSION_POOL,
    RANDOM_EVENTS,
    STARTS,
    FACTION_RELATIONS,
    ENCOUNTER_FLAVOUR,
    SURRENDER_CONSEQUENCE
  };
})();