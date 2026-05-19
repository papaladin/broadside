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
 
  // ═══════════════════════════════════════════════════
  //  STANDARD — visible and reachable from the start
  // ═══════════════════════════════════════════════════
 
  tortuga: {
    name: "Tortuga", faction: "pirate",
    x: 490, y: 245,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "A lawless haven for pirates and buccaneers. The most notorious port in the Caribbean.",
  },
 
  portDepaix: {
    name: "Port-de-Paix", faction: "french",
    x: 476, y: 228,
    services: ["tavern", "crew", "missions"],
    desc: "A small French port on northern Saint-Domingue, close neighbour to Tortuga.",
  },
 
  petitGoave: {
    name: "Petit-Goâve", faction: "french",
    x: 460, y: 270,
    services: ["tavern", "crew", "missions"],
    desc: "A French buccaneer base on western Saint-Domingue. Rougher and more desperate than Martinique.",
  },
 
  santoDomingo: {
    name: "Santo Domingo", faction: "spanish",
    x: 545, y: 268,
    services: ["tavern", "shipyard", "crew"],
    desc: "The oldest European city in the Americas. A proud Spanish administrative centre on Hispaniola.",
  },
 
  havana: {
    name: "Havana", faction: "spanish",
    x: 310, y: 190,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "Crown jewel of Spanish power in the New World. Heavily fortified and fiercely proud.",
  },
 
  santiagoDeCuba: {
    name: "Santiago de Cuba", faction: "spanish",
    x: 415, y: 238,
    services: ["tavern", "shipyard", "missions"],
    desc: "The second city of Cuba. A waypoint for Spanish convoys heading east toward Hispaniola.",
  },
 
  nassau: {
    name: "Nassau", faction: "pirate",
    x: 405, y: 152,
    services: ["tavern", "crew", "missions"],
    desc: "A loosely governed English settlement in the Bahamas. Rapidly becoming a pirate refuge.",
  },
 
  portRoyal: {
    name: "Port Royal", faction: "english",
    x: 405, y: 280,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "The wealthiest English harbour in the Caribbean. Rebuilt since the great earthquake of 1692.",
  },
 
  kingston: {
    name: "Kingston", faction: "english",
    x: 422, y: 296,
    services: ["tavern", "crew"],
    desc: "A young town growing in Port Royal's shadow. Modest but honest trade and a welcome harbour.",
  },
 
  portobelo: {
    name: "Portobelo", faction: "spanish",
    x: 355, y: 430,
    services: ["tavern", "shipyard", "missions"],
    desc: "The treasure fair port of the Spanish Main. Silver from Peru flows through here before the Atlantic crossing.",
  },
 
  cartagena: {
    name: "Cartagena", faction: "spanish",
    x: 440, y: 415,
    services: ["tavern", "shipyard", "missions"],
    desc: "A formidable fortified city. The Spanish treasure fleet assembles here — rich, guarded, and unforgiving.",
  },
 
  maracaibo: {
    name: "Maracaibo", faction: "spanish",
    x: 515, y: 410,
    services: ["tavern", "shipyard", "missions"],
    desc: "A Spanish colonial port deep in a sheltered lake. Sacked by Morgan, now more heavily garrisoned.",
  },
 
  curacao: {
    name: "Curaçao", faction: "dutch",
    x: 558, y: 390,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "The jewel of Dutch Caribbean trade. A prosperous free port with a sharp mercantile eye.",
  },
 
  stEustatius: {
    name: "St. Eustatius", faction: "dutch",
    x: 672, y: 287,
    services: ["tavern", "crew", "missions"],
    desc: "The Golden Rock. A Dutch free-trade port where anything can be bought if the price is right.",
  },
 
  martinique: {
    name: "Martinique", faction: "french",
    x: 700, y: 335,
    services: ["tavern", "crew", "missions"],
    desc: "A proud French colony rich in sugar and rum. The most cultivated port in the eastern Caribbean.",
  },
 
  bridgetown: {
    name: "Bridgetown", faction: "english",
    x: 728, y: 368,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "The beating heart of English sugar trade. Barbados is the wealthiest island in the New World.",
  },
 
  // ═══════════════════════════════════════════════════
  //  REMOTE — visible on map but require sufficient
  //  ship range (brigantine+ typically). Greyed out
  //  in MapScreen when canReach() returns false.
  // ═══════════════════════════════════════════════════
 
  campeche: {
    name: "Campeche", faction: "spanish",
    x: 148, y: 248,
    services: ["tavern", "shipyard", "missions"],
    desc: "A Gulf of Mexico port famous for logwood. Remote and frequently raided by buccaneers.",
  },
 
  veracruz: {
    name: "Veracruz", faction: "spanish",
    x: 38, y: 258,
    services: ["tavern", "shipyard", "missions"],
    desc: "The origin point of the Spanish treasure fleets. Immensely wealthy and immensely dangerous.",
  },
 
  bermuda: {
    name: "Bermuda", faction: "english",
    x: 648, y: 35,
    services: ["tavern", "crew"],
    desc: "A remote English outpost far to the north. A vital resupply stop for ships making the Atlantic crossing.",
  },
 
  providencia: {
    name: "Old Providence", faction: "pirate",
    x: 248, y: 358,
    services: ["tavern", "crew", "missions"],
    desc: "A remote island off Nicaragua used by buccaneers and rogue English settlers. Off every map that matters.",
  },
 
  trinidad: {
    name: "Trinidad", faction: "spanish",
    x: 672, y: 415,
    services: ["tavern", "missions"],
    desc: "A remote Spanish island at the Caribbean's southeastern edge. Gateway to the South American mainland.",
  },
 
  // ═══════════════════════════════════════════════════
  //  HIDDEN — not rendered on MapScreen until
  //  unlockCondition is satisfied for the current
  //  save state. Logic lives in canSeePort() in
  //  logic.js (Phase 3 implementation).
  //
  //  These ports are fully inert until that function
  //  is written — the unlockCondition field is ignored
  //  by all current code.
  // ═══════════════════════════════════════════════════
 
  roatan: {
    name: "Roatán", faction: "pirate",
    x: 220, y: 308,
    services: ["tavern", "crew", "missions"],
    desc: "A secret pirate haven in the Bay Islands of Honduras. No navy has found it yet.",
    unlockCondition: {
      type: "any", conditions: [
        { type: "fame",       value: 100 },
        { type: "reputation", faction: "pirate", value: 80 },
      ],
    },
  },
 
  dryTortugas: {
    name: "Dry Tortugas", faction: "pirate",
    x: 295, y: 158,
    services: ["tavern", "missions"],
    desc: "A desolate cluster of islands at the tip of the Florida Keys. A pirate waypoint hidden in plain sight.",
    unlockCondition: {
      type: "item", value: "map_fragment_tortugas",
    },
  },
 
  lasAves: {
    name: "Las Aves", faction: "pirate",
    x: 590, y: 388,
    services: ["tavern", "missions"],
    desc: "A treacherous shoal island group. The wrecks of a French fleet lie here. Pirates know the safe channels.",
    unlockCondition: {
      type: "item", value: "map_fragment_lasAves",
    },
  },
 
  libertalia: {
    name: "Libertalia", faction: "pirate",
    x: 718, y: 445,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "The legendary pirate utopia. Some say it does not exist. Those who have been there do not say much at all.",
    unlockCondition: {
      type: "all", conditions: [
        { type: "fame",  value: 300 },
        { type: "item",  value: "map_fragment_libertalia" },
        { type: "ship",  minSize: "frigate" },
      ],
    },
  },
 
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
      requiredFame: 50,
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
      requiredFame: 100,
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
      requiredFame: 50,
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
      requiredFame: 100,
      effects: { speedBonus: 1 }
    },
    navigational_tools: {
      name: "Navigational Tools",
      desc: "-1 day travel time (better routing)",
      cost: 600,
      requiredFame: 50,
      effects: { speedBonus: 1 }
    }
  };

  // ── Crew Name Pools (minimal starter set) ───────────────────────
const CREW_FIRST_NAMES = {
  english: ["William","John","Henry","Edward","Charles","James","Thomas","George",
    "Samuel","Richard","Robert","Joseph","Benjamin","Nathaniel","Francis",
    "Peter","Jacob","Andrew","Nicholas","Matthew","Anne","Mary","Elizabeth",
    "Sarah","Margaret","Jane","Alice","Katherine","Rebecca","Abigail"],

  spanish: ["Carlos","Miguel","Diego","José","Francisco","Antonio",
    "Manuel","Pedro","Juan","Alonso","Fernando","Rafael","Joaquín",
    "Isabella","María","Catalina","Inés","Juana","Teresa","Beatriz",
    "Ana","Leonor","Magdalena"],

  french: ["Jean","Pierre","Louis","Henri","Antoine","Claude","Jacques",
    "François","Étienne","Michel","Nicolas","André","Luc","Guillaume",
    "Marie","Jeanne","Marguerite","Catherine","Anne","Louise","Madeleine",
    "Élisabeth","Charlotte","Françoise"],

  dutch: ["Willem","Jan","Pieter","Hendrik","Cornelis","Dirk","Adriaan",
    "Jacob","Claes","Maarten","Johannes","Frans","Michiel",
    "Anna","Maria","Elisabeth","Catharina","Geertruida","Margaretha",
    "Johanna","Eva"],

  pirate: ["Calico","Blackwood","Bloodworth","Crowe","Morgan","Rackham",
    "Teach","Vane","Bonny","Low","Avery","Read","Drake",
    "Ashford","Briggs","Graves","Storm","Skullridge","Dread"],
};

const CREW_LAST_NAMES = {
  english: ["Smith","Brown","Taylor","Wilson","Davies","Jones","Williams","Clark",
    "White","Harris","Walker","Wright","Turner","Cooper","Baker","Carter",
    "Hill","Ward","Morgan","Bell","Parker","Mitchell","Wood","Cook",
    "Webb","Bailey","Price","Bennett","Foster","Griffin"],

  spanish: ["García","Rodríguez","López","Martínez","Hernández","González",
    "Pérez","Sánchez","Ramírez","Torres","Ruiz","Flores","Morales",
    "Navarro","Castillo","Romero","Ortega","Delgado","Cruz","Mendoza",
    "Vargas","Silva","Rojas","Herrera","Campos"],

  french: ["Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit",
    "Durand","Leroy","Moreau","Simon","Laurent","Michel","Lefebvre",
    "Roux","Fontaine","Chevalier","Mercier","Girard","Blanchard",
    "Garnier","Bonnet","Lambert","Renaud"],

  dutch: ["de Vries","van Dijk","Bakker","Janssen","Smit","Meijer",
    "de Boer","Mulder","Dekker","van den Berg","Visser","Vos",
    "van Rijn","Kuiper","van Leeuwen","van der Meer","Post",
    "de Groot","Kramer","van Dam","Schouten"],

  pirate: ["Rackham","Teach","Vane","Bonny","Drake","Morgan","Low",
    "Avery","Read","Thatch","Blackwood","Bloodworth","Crowe",
    "Hawkins","Graves","Storm","Ashford","Briggs","Skullridge","Dread"],
};

  const CREW_ROLES = [
    { role: "deckhand", weight: 60 },
    { role: "gunner",   weight: 20 },
    { role: "cook",     weight: 5 },
    { role: "carpenter",weight: 10 },
    { role: "navigator",weight: 5 },
  ];


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
      fame: 1,
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
      fame: 1,
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
      fame: 1,
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
      fame: 1,
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
      fame: 1,
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
      requiredFame: 50,
      fame: 1,
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
      requiredFame: 50,
      fame: 1,
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
      fame: 1,
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
      infamyGain: 2,
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
      fame: 1,
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
      requiredFame: 100,
      infamyGain: 2,
      fame: 3,
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
      requiredFame: 100,
      infamyGain: 2,
      fame: 3,
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
      id: "assault_portRoyal",
      name: "Strike at Port Royal",
      desc: "Dare to attack the heart of English power in the Caribbean.",
      targetPort: "portRoyal",
      type: "assault",
      gold: 5000,
      requiredFame: 100,
      infamyGain: 2,
      fame: 3,
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
      targetPort: "portRoyal",
      type: "patrol",
      gold: 800,
      fame: 1,
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
    CREW_FIRST_NAMES,
    CREW_LAST_NAMES,
    CREW_ROLES,
    UPGRADES,
    MISSION_POOL,
    RANDOM_EVENTS,
    STARTS,
    ENCOUNTER_FLAVOUR,
    SURRENDER_CONSEQUENCE
  };
})();