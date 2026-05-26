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
 
  portDePaix: {
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
    services: ["tavern", , "shipyard", "crew", "missions"],
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
    minHull: 101,
    services: ["tavern", "shipyard", "missions"],
    desc: "A Gulf of Mexico port famous for logwood. Remote and frequently raided by buccaneers.",
  },
 
  veracruz: {
    name: "Veracruz", faction: "spanish",
    x: 38, y: 258,
    minHull: 101,
    services: ["tavern", "shipyard", "missions"],
    desc: "The origin point of the Spanish treasure fleets. Immensely wealthy and immensely dangerous.",
  },
 
  bermuda: {
    name: "Bermuda", faction: "english",
    x: 648, y: 35,
    minHull: 101,
    services: ["tavern", "crew"],
    desc: "A remote English outpost far to the north. A vital resupply stop for ships making the Atlantic crossing.",
  },
 
  providencia: {
    name: "Old Providence", faction: "pirate",
    x: 248, y: 358,
    minHull: 101,
    services: ["tavern", "crew", "missions"],
    desc: "A remote island off Nicaragua used by buccaneers and rogue English settlers. Off every map that matters.",
  },
 
  trinidad: {
    name: "Trinidad", faction: "spanish",
    x: 672, y: 415,
    minHull: 101,
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
    minHull: 101,
    services: ["tavern", "crew", "missions"],
    desc: "A secret pirate haven in the Bay Islands of Honduras. No navy has found it yet.",
    hidden: true,
    unlockCondition: {
      type: "any", conditions: [
        { type: "fame",       value: 50 },
        { type: "reputation", faction: "pirate", value: 65 },
      ],
    },
  },
 
  dryTortugas: {
    name: "Dry Tortugas", faction: "pirate",
    x: 295, y: 158,
    minHull: 101,
    services: ["tavern", "missions"],
    desc: "A desolate cluster of islands at the tip of the Florida Keys. A pirate waypoint hidden in plain sight.",
    hidden: true,
    unlockCondition: {
      type: "all", conditions: [
        { type: "infamy",       value: 25 },
        { type: "reputation", faction: "pirate", value: 65 },
      ],
    },
  },
 
  lasAves: {
    name: "Las Aves", faction: "pirate",
    x: 590, y: 388,
    minHull: 101,
    services: ["tavern", "missions"],
    desc: "A treacherous shoal island group. The wrecks of a French fleet lie here. Pirates know the safe channels.",
    hidden: true,
    unlockCondition: {
      type: "item", value: "map_fragment_lasAves",
    },
  },
 
  libertalia: {
    name: "Libertalia", faction: "pirate",
    x: 718, y: 445,
    minHull: 101,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "The legendary pirate utopia. Some say it does not exist. Those who have been there do not say much at all.",
    hidden: true,
    unlockCondition: {
      type: "all", conditions: [
        { type: "fame",  value: 200 },
        { type: "item",  value: "map_fragment_libertalia" },
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

  // Tier 0
  dinghy: { name: "Dinghy", maxHull: 30, maxCrew: 5, cannons: 2, speed: 6, cost: 200, requiredFame: 0, maxDays: 5, holdCapacity: 20,
    upgradeable: [],
    desc: "A tiny boat. Barely seaworthy, but cheap."
  },

  cutter: { name: "Cutter", maxHull: 60, maxCrew: 20, cannons: 6, speed: 20, cost: 600, requiredFame: 0, maxDays: 8, holdCapacity: 80,
    upgradeable: ["reinforced_hull"],
    desc: "Small, fast, and agile. Excellent for scouting and smuggling."
  },

  // Tier 1
  sloop: { name: "Sloop", maxHull: 100, maxCrew: 50, cannons: 10, speed: 18, cost: 1000, requiredFame: 10, maxDays: 10, holdCapacity: 200,
    upgradeable: ["reinforced_hull", "extra_cannons"],
    desc: "Fast and maneuverable. Ideal for hit-and-run tactics."
  },


  // Tier 2
  schooner: { name: "Schooner", maxHull: 110, maxCrew: 55, cannons: 8, speed: 19, cost: 1800, requiredFame: 50, maxDays: 12, holdCapacity: 240,
    upgradeable: ["reinforced_hull", "figurehead"],
    desc: "Favored by smugglers and pirates for its speed and shallow draft."
  },

  merchantman: { name: "Merchantman", maxHull: 180, maxCrew: 60, cannons: 5, speed: 10, cost: 1500, requiredFame: 50, maxDays: 14, holdCapacity: 600,
    upgradeable: ["reinforced_hull"],
    desc: "Built for trade, not combat. Large cargo hold, but weak in a fight."
  },

  brigantine: { name: "Brigantine", maxHull: 150, maxCrew: 80, cannons: 15, speed: 14, cost: 2500, requiredFame: 50, maxDays: 14, holdCapacity: 448,
    upgradeable: ["reinforced_hull", "extra_cannons", "figurehead"],
    desc: "Balanced ship with good speed and firepower."
  },


  // Tier 3
  corvette: { name: "Corvette", maxHull: 180, maxCrew: 90, cannons: 18, speed: 15, cost: 3500, requiredFame: 100, maxDays: 16, holdCapacity: 500,
    upgradeable: ["reinforced_hull", "extra_cannons", "copper_hull"],
    desc: "A swift naval warship designed to hunt pirates and escort convoys."
  },

  frigate: { name: "Frigate", maxHull: 220, maxCrew: 120, cannons: 24, speed: 12, cost: 4500, requiredFame: 100, maxDays: 18, holdCapacity: 720,
    upgradeable: ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"],
    desc: "A powerful warship with heavy guns and solid endurance."
  },

  fluyt: { name: "Fluyt", maxHull: 180, maxCrew: 70, cannons: 6, speed: 9, cost: 4200, requiredFame: 100, maxDays: 24, holdCapacity: 1100,
    upgradeable: ["reinforced_hull", "expanded_hold"],
    desc: "A Dutch cargo vessel optimized for long-distance trade and massive profits."
  },


  // Tier 4
  galleon: { name: "Galleon", maxHull: 300, maxCrew: 150, cannons: 30, speed: 7, cost: 8000, requiredFame: 150, maxDays: 22, holdCapacity: 1320,
    upgradeable: ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"],
    desc: "The king of the seas. Slow but nearly unstoppable in combat."
  },

  ship_of_the_line: { name: "Ship of the Line", maxHull: 420, maxCrew: 280, cannons: 50, speed: 5, cost: 15000, requiredFame: 150, maxDays: 28, holdCapacity: 1600,
    upgradeable: ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"],
    desc: "A colossal naval fortress capable of dominating entire fleets."
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
      rivalFactions: ["english"]
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


  // ---- RESOURCES AND ECONOMY SYSTEM -------------------------------

const RESOURCES = {
  food:    { name: "Food",    basePrice: 3,   variance: 0, illegal: false, infamyOnBuy: 0, unit: "ration" },
  water:   { name: "Water",   basePrice: 2,   variance: 0, illegal: false, infamyOnBuy: 0, unit: "barrel" },
  rum:     { name: "Rum",     basePrice: 30,  variance: 0.20, illegal: false, infamyOnBuy: 0, unit: "cask", smuggleHint: "Commonly found in pirate ports and French islands.",   },
  sugar:   { name: "Sugar",   basePrice: 40,  variance: 0.25, illegal: false, infamyOnBuy: 0, unit: "sack"   },
  timber:  { name: "Timber",  basePrice: 25,  variance: 0.15, illegal: false, infamyOnBuy: 0, unit: "plank"  },
  cloth:   { name: "Cloth",   basePrice: 55,  variance: 0.20, illegal: false, infamyOnBuy: 0, unit: "bale"   },
  spices:  { name: "Spices",  basePrice: 120, variance: 0.45, illegal: false, infamyOnBuy: 0, unit: "chest"  },
  silk:    { name: "Silk",    basePrice: 160, variance: 0.30, illegal: false, infamyOnBuy: 0, unit: "bolt"   },
  coffee:  { name: "Coffee",  basePrice: 70,  variance: 0.25, illegal: false, infamyOnBuy: 0, unit: "bag"    },
  cocoa:   { name: "Cocoa",   basePrice: 90,  variance: 0.30, illegal: false, infamyOnBuy: 0, unit: "crate"  },
  weapons: { name: "Weapons", basePrice: 80,  variance: 0.35, illegal: false, infamyOnBuy: 0, unit: "crate"  },
  tobacco: { name: "Tobacco", basePrice: 90,  variance: 0.30, illegal: true, infamyOnBuy: 0, unit: "bale" , sourceHint: "Found in Havana, Tortuga, Providencia, and Nassau.",  },
  silver:  { name: "Silver",  basePrice: 250, variance: 0.35, illegal: false, infamyOnBuy: 0, unit: "chest"  },
  slaves:  { name: "Slaves",  basePrice: 220, variance: 0.60, illegal: true,  infamyOnBuy: 1, unit: "person",  sourceHint: "Available in Portobelo, Cartagena, Libertalia, and Veracruz.", },
};

// Column order:
// food, water, rum, sugar, timber, cloth, spices, silk, coffee, cocoa, weapons, tobacco, silver, slaves

const GOODS_AVAILABILITY = {
  //english
  portRoyal:   [ "always","always","frequently","sometimes","frequently","frequently","sometimes","rarely","sometimes","rarely","sometimes","sometimes","rarely","rarely" ],
  kingston:    [ "always","always","sometimes","sometimes","frequently","sometimes","rarely","rarely","frequently","rarely","rarely","frequently","never","never" ],
  bridgetown:  [ "always","always","frequently","always","rarely","frequently","sometimes","rarely","frequently","sometimes","rarely","sometimes","rarely","rarely" ],
  bermuda:     [ "always","always","rarely","rarely","rarely","sometimes","frequently","rarely","rarely","never","sometimes","sometimes","never","never" ],

  //spanish
  havana:      [ "always","always","frequently","frequently","rarely","frequently","sometimes","rarely","sometimes","sometimes","sometimes","always","sometimes","rarely" ],
  santiagoDeCuba:[ "always","always","frequently","sometimes","rarely","frequently","sometimes","rarely","sometimes","sometimes","rarely","frequently","sometimes","rarely" ],
  santoDomingo:[ "always","always","sometimes","sometimes","sometimes","frequently","sometimes","rarely","sometimes","frequently","rarely","sometimes","sometimes","rarely" ],
  cartagena:   [ "always","always","sometimes","sometimes","rarely","frequently","sometimes","sometimes","sometimes","frequently","rarely","sometimes","frequently","sometimes" ],
  maracaibo:   [ "always","always","rarely","sometimes","frequently","sometimes","rarely","rarely","sometimes","frequently","rarely","sometimes","sometimes","rarely" ],
  portobelo:   [ "always","always","sometimes","rarely","rarely","frequently","sometimes","sometimes","rarely","always","rarely","sometimes","frequently","sometimes" ],
  campeche:    [ "always","always","rarely","sometimes","frequently","rarely","sometimes","never","sometimes","rarely","rarely","sometimes","frequently","never" ],
  veracruz:    [ "always","always","sometimes","sometimes","sometimes","frequently","sometimes","sometimes","sometimes","always","rarely","sometimes","frequently","sometimes" ],
  trinidad:    [ "always","always","sometimes","frequently","sometimes","sometimes","sometimes","rarely","sometimes","rarely","rarely","sometimes","sometimes","rarely" ],

  //french
  portDePaix:  [ "always","always","sometimes","frequently","rarely","sometimes","rarely","never","frequently","sometimes","rarely","sometimes","never","rarely" ],
  petitGoave:  [ "always","always","sometimes","frequently","rarely","sometimes","rarely","never","frequently","rarely","sometimes","sometimes","never","rarely" ],
  martinique:  [ "always","always","frequently","always","rarely","sometimes","sometimes","rarely","frequently","sometimes","rarely","sometimes","never","rarely" ],

  //dutch
  curacao:     [ "always","always","sometimes","sometimes","sometimes","frequently","frequently","sometimes","sometimes","sometimes","frequently","sometimes","sometimes","rarely" ],
  stEustatius: [ "always","always","sometimes","rarely","rarely","frequently","sometimes","sometimes","sometimes","rarely","frequently","sometimes","rarely","sometimes" ],

  //pirate
  tortuga:     [ "always","always","always","rarely","sometimes","rarely","rarely","never","rarely","never","frequently","frequently","rarely","sometimes" ],
  nassau:      [ "always","always","frequently","rarely","rarely","rarely","rarely","never","rarely","never","sometimes","sometimes","rarely","sometimes" ],
  providencia: [ "always","always","rarely","rarely","rarely","rarely","never","never","sometimes","never","frequently","frequently","never","rarely" ],
  roatan:      [ "always","always","rarely","never","rarely","rarely","never","never","sometimes","never","frequently","sometimes","never","rarely" ],

  //hidden, to unlock.
  dryTortugas: [ "always","always","sometimes","never","never","never","never","never","never","never","rarely","sometimes","rarely","never" ],
  lasAves:     [ "always","always","never","never","never","never","never","never","never","never","never","rarely","rarely","rarely" ],
  libertalia:  [ "always","always","always","rarely","rarely","rarely","rarely","sometimes","sometimes","sometimes","frequently","frequently","sometimes","frequently" ],
};





// ── Parametric Mission Generator Config ────────────────────────

const MISSION_GOLD_RANGES = {
  //          [low,      medium,    high,      assault  ]
  0: { low: [150,300], medium: [300,550],  high: [550,900],  assault: [900,1400]  },
  1: { low: [250,500], medium: [500,850],  high: [850,1400], assault: [1400,2200] },
  2: { low: [400,750], medium: [750,1200], high: [1200,2000],assault: [2000,3200] },
  3: { low: [650,1100],medium: [1100,1800],high: [1800,3000],assault: [3000,5000] },
  4: { low: [1000,1600],medium:[1600,2600],high: [2600,4200],assault: [4200,7000] },
};

const MISSION_ENEMY_RANGES = {
  hull:    { 0:[20,45],  1:[40,75],  2:[65,110], 3:[95,155],  4:[135,210] },
  cannons: { 0:[2,6],    1:[5,10],   2:[8,16],   3:[13,22],   4:[18,30]   },
  crew:    { 0:[8,18],   1:[15,35],  2:[25,55],  3:[40,80],   4:[60,110]  },
};

const MISSION_REP_IMPACTS = {
  escort:  { low: 2, medium: 3, high: 4 },
  patrol:  { low: 2, medium: 3, high: 4 },
  combat:  { low: 3, medium: 4, high: 5 },
  smuggle: { any: 2 },
  assault: { any: 5 },
};

// ── Trade & Smuggle Mission Config ──────────────────────────────

const TRADE_MISSION_PROFIT_MARGINS = {
  low:    0.60,
  medium: 0.80,
  high:   1.10,
};

const SMUGGLE_PROFIT_MARGINS = {
  low:    0.80,
  medium: 1.20,
  high:   1.80,
};

const TRADE_GOODS_BY_TIER = {
  0: ["rum", "sugar", "timber", "cloth"],
  1: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa"],
  2: ["coffee", "cocoa", "cloth", "weapons", "spices"],
  3: ["spices", "silk", "weapons", "cocoa"],
  4: ["spices", "silk", "weapons", "cocoa"],
};

const SMUGGLE_GOODS_BY_TIER = {
  0: ["rum", "tobacco"],
  1: ["rum", "tobacco"],
  2: ["rum", "tobacco", "slaves"],
  3: ["rum", "tobacco", "slaves"],
  4: ["rum", "tobacco", "slaves"],
};

const MISSION_NAME_PARTS = {
  cargo:      ["spice shipment","merchant convoy","supply fleet","noble passenger","silver bullion","colonial goods","textile cargo","grain stores"],
  contraband: ["rum","stolen charts","black powder","foreign silk","untaxed tobacco","opium","illegal firearms","forbidden books"],
  regionAdj:  ["southern","northern","treacherous","disputed","windward","leeward","inner","outer"],
  factionAdj: {
    english: ["English","Crown","His Majesty's","Royal"],
    spanish: ["Spanish","Colonial","Crown","Viceroyalty"],
    french:  ["French","Republican","Gallic","Louis'"],
    dutch:   ["Dutch","Company","Merchant","West India"],
    pirate:  ["Brotherhood","Free","Unaligned","Brethren"],
  },
};

const ENEMY_SHIP_NAMES = {
  adjectives: ["Black","Scarlet","Iron","Crimson","Silent","Cursed","Broken","Savage","Dread","Wicked"],
  nouns:      ["Serpent","Tide","Fortune","Drake","Widow","Storm","Revenge","Horizon","Ghost","Fury"],
};

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

    //Map fragments
    {
      id: "mysterious_chart",
      title: "A Dying Sailor's Secret",
      type: "discovery",
      desc: "A dying sailor presses a folded chart into your hands. The coastline it marks is like nothing on any official map — a sheltered harbour surrounded by reefs, with no name written.",
      condition: (state) =>
        state.fame >= 100 &&
        !(state.mapFragments || []).includes("map_fragment_libertalia"),
      choices: [
        {
          label: "Take the chart",
          outcome: {
            mapFragment: "map_fragment_libertalia",
            log: "The chart marks a place the sailor called Libertalia. You fold it carefully."
          }
        },
        {
          label: "Leave it with him",
          outcome: {
            log: "You leave the chart. Some secrets aren't yours to keep."
          }
        }
      ]
    },
    {
  id: "wreckers_chart",
  title: "The Wrecker's Map",
  type: "discovery",
  desc: "An old wrecker in the tavern offers you a stained, salt‑crusted chart. 'Las Aves,' he says. 'The birds will show you the channel. The wrecks will make you rich.' He wants 50 gold for it.",
  condition: (state) =>
    state.fame >= 50 &&
    !(state.mapFragments || []).includes("map_fragment_lasAves"),
  choices: [
    {
      label: "Buy the chart (‑50g)",
      outcome: {
        gold: -50,
        mapFragment: "map_fragment_lasAves",
        log: "The chart marks a treacherous shoal called Las Aves. The wrecker wasn't lying about the birds."
      }
    },
    {
      label: "Decline",
      outcome: {
        log: "You hand the chart back. The wrecker shrugs. 'Your loss, Captain.'"
      }
    }
  ]
},

  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  STARTS: Starting scenarios for new games.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const STARTS = [
  // ── English ───────────────────────────────────────────────────
  {
    id: "english_william",
    name: "The Forged Commission",
    faction: "english",
    tagline: "You carry papers you did not earn.",
    story: "William Calder forged a letter of commission after his employer died. The ink is passable. The signature is not. He needs to become the kind of captain who doesn't need the letter before someone in Port Royal looks closely enough to notice.",
    startPort: "portRoyal",
    ship: "dinghy",
    gold: 190,
    crewCount: 1,
    crewFaction: "english",
    hold: { food: 8, water: 8 },
    repAdjust: { english: +10, pirate: -5 },
    openingLog: [
      "Cleared Port Royal on a borrowed tide. The harbormaster stamped my commission without reading it. He never reads them.",
      "Okafor is useful and incurious. I paid his debt to get him. Worth every coin.",
      "I need a real reputation before someone calls my bluff. That means work. English work, legal work — at least for now.",
    ],
    starterMission: {
      type: "escort", name: "Carry the Dispatch to Kingston",
      description: "An official packet needs to reach the governor's secretary at Kingston. The harbormaster was very clear it should arrive sealed. It's routine paperwork — or it would be, if you were a real Sailing Master.",
      faction: "english", targetPort: "kingston", risk: "low",
      gold: 240, fame: 1, infamyGain: 0,
      repImpact: { english: 2 }, enemy: null,
      starter: true,
    },
  },

  // ── Spanish ───────────────────────────────────────────────────
  {
    id: "spanish_elena",
    name: "The Governor's Errand",
    faction: "spanish",
    tagline: "Don Luis gave you the boat and a vague instruction. Make yourself useful.",
    story: "Elena Vargas was handed a dinghy, a sealed crate, and a debt she didn't owe. She has no crew. She prefers it that way. Fewer people know she exists. Fewer people know where she's going.",
    startPort: "havana",
    ship: "dinghy",
    gold: 205,
    crewCount: 0,
    crewFaction: "spanish",
    hold: { food: 8, water: 8 },
    repAdjust: { spanish: +10, english: -5 },
    openingLog: [
      "Don Luis watched the harbour from his window this morning. I did not look back when I cast off.",
      "The crate makes no sound. It's heavier than it looks. I've decided not to think about it.",
      "First delivery: Santiago de Cuba. After that, I'll know if I have a choice in any of this.",
      "Sailing alone is harder than I expected. I'll need crew. Someone who doesn't ask questions.",
    ],
    starterMission: {
      type: "escort", name: "The Package for Santiago",
      description: "Don Luis's crate must reach a contact in Santiago de Cuba. No questions. No inspection. A sealed delivery, prompt and quiet.",
      faction: "spanish", targetPort: "santiagoDeCuba", risk: "low",
      gold: 280, fame: 1, infamyGain: 0,
      repImpact: { spanish: 3 }, enemy: null,
      starter: true, plotItem: true,
    },
  },

  // ── French ────────────────────────────────────────────────────
  {
    id: "french_luc",
    name: "The Cartographer's Debt",
    faction: "french",
    tagline: "Your master left you his boat, his charts, and a debt he forgot to mention in the will.",
    story: "Luc Fontaine inherited his mentor's dinghy, his instruments, and a six‑month charting contract the late cartographer had been paid for in advance. The navy wants the charts delivered by the agreed date. Luc prefers the dinghy. Marie‑Ange Desroches, the former cook, agreed to stay on. She is more competent than Luc at most sailing tasks and less diplomatic about saying so.",
    startPort: "petitGoave",
    ship: "dinghy",
    gold: 190,
    crewCount: 1,
    crewFaction: "french",
    hold: { food: 8, water: 8 },
    repAdjust: { french: +10, english: -5 },
    openingLog: [
      "Deschamps's charts are better than anything the navy has. That's why they want them finished. That's also why I have leverage, if I'm careful.",
      "Desroches says I navigate like I'm reading someone else's handwriting. She is not wrong.",
      "The naval officer said 'by the agreed date' twice. The date is in six months. I have time — if I keep moving.",
      "There is a note in Deschamps's margin on the passage to Port‑de‑Paix. Something that doesn't appear on any official chart. I'll look when I'm there.",
    ],
    starterMission: {
      type: "patrol", name: "Chart the Northern Passage",
      description: "The French naval office wants updated soundings on the route between Martinique and Port‑de‑Paix. Sail the passage and return. Deschamps's notes mention something interesting near the northern end that no official chart acknowledges.",
      faction: "french", targetPort: "portDePaix", risk: "low",
      gold: 220, fame: 1, infamyGain: 0,
      repImpact: { french: 2 }, enemy: null,
      starter: true,
    },
  },

  // ── Dutch ─────────────────────────────────────────────────────
  {
    id: "dutch_pieter",
    name: "The Company's Ledger",
    faction: "dutch",
    tagline: "The Dutch West India Company gave you the boat, the freedom, and a quota. The freedom, you have learned, is the trap.",
    story: "Pieter van Houten found a discrepancy in a senior partner's account. He was 'promoted' to independent trade contractor within the week. His own vessel. His own routes. A quarterly gold quota. No cargo provided. Plenty of implied understanding about consequences.",
    startPort: "lasAves",
    ship: "dinghy",
    gold: 205,
    crewCount: 0,
    crewFaction: "dutch",
    hold: { food: 8, water: 8 },
    repAdjust: { dutch: +10, spanish: -5 },
    openingLog: [
      "The Company gave me a list of contacts. Curaçao is on it. I did not expect Curaçao.",
      "First quarter quota: 1,200 gold delivered to Company warehouses. Thirty days. I'd better start.",
      "The freedom is real enough. It's the accounting that isn't free.",
      "I'll need crew. A one‑man dinghy in these waters is a statement of either poverty or arrogance. I can't afford either.",
    ],
    starterMission: {
      type: "escort", name: "The Consignment for Curaçao",
      description: "A Dutch merchant factor on Curaçao is waiting for a consignment order Pieter is to collect from Sint Eustatius company warehouse and deliver. The manifest is signed by someone Pieter recognises from the discrepancy he recorded. He chooses not to think about that.",
      faction: "dutch", targetPort: "curacao", risk: "low",
      gold: 250, fame: 1, infamyGain: 0,
      repImpact: { dutch: 3 }, enemy: null,
      starter: true,
    },
  },

  // ── Pirate ────────────────────────────────────────────────────
  {
    id: "pirate_rosa",
    name: "The Survivor",
    faction: "pirate",
    tagline: "The Marguerite is at the bottom of the sea. You and Cacao are the only ones left.",
    story: "Rosa Esperanza spent two years on Captain Bouchard's ship, learning which ports ran real patrols and which ran theater. When a storm took the Marguerite, Rosa and Cacao Santos — a Cuban gunner — survived on a dinghy. They made Tortuga on the fifth day. Everyone else is gone. Rosa has a boat, a friend, two years of knowledge, and no particular loyalty to anyone who isn't standing next to her.",
    startPort: "tortuga",
    ship: "dinghy",
    gold: 190,
    crewCount: 1,
    crewFaction: "pirate",
    hold: { food: 12, water: 12 },
    repAdjust: { pirate: +10, spanish: -5 },
    openingLog: [
      "Tortuga smells like rum and bad decisions. I've missed it.",
      "Cacao says we should find a crew and a real ship before we do anything else. He's right, as usual.",
      "Bouchard knew every useful person in the Caribbean. I know who they are. He kept the introductions to himself. Time to make my own.",
      "Two years of watching from the deck. I know the routes. I know the prices. I know the mistakes people make. Now I find out if knowing is enough.",
    ],
    starterMission: {
      type: "escort", name: "Find Renard in Nassau",
      description: "A message from Tortuga's port master needs to reach Captain Renard, last seen in Nassau. Renard is someone Bouchard dealt with — Rosa knows the name but not the face. Delivering the message is a way to introduce herself to the network Bouchard left behind.",
      faction: "pirate", targetPort: "nassau", risk: "low",
      gold: 200, fame: 1, infamyGain: 0,
      repImpact: { pirate: 3 }, enemy: null,
      starter: true,
    },
  },

  // ── Debug ─────────────────────────────────────────────────────
  {
    id: "debug",
    name: "⚙ Developer Mode",
    faction: "english",
    tagline: "Skip the early game. Test what you need to test.",
    story: "Start at fame 100 with 5,000 gold. All ports Friendly. Sloop. Full hold of trade goods.",
    startPort: "portRoyal",
    ship: "sloop",
    gold: 5000,
    crewCount: 20,
    crewFaction: "pirate",
    hold: { food: 20, water: 20, rum: 10, spices: 5, silk: 3 },
    repAdjust: { english: +30, spanish: +15, french: +15, dutch: +15, pirate: +10 },
    openingLog: [
      "DEBUG MODE: Gold 5000, Fame 100. All ports at minimum Friendly standing.",
      "Use the ⚙ debug panel in the HUD for quick adjustments.",
    ],
    starterMission: null,
    debugStartFame: 100,
  },
];


  const ENCOUNTER_FLAVOUR = {
    patrol: (enemy, rep) => rep < 20
      ? `A ${enemy.name} opens fire without warning.`
      : `A ${enemy.name} hails you and demands you heave to for inspection.`,

    "navy_patrol": (enemy, rep) =>
     `A patrol from the ${enemy.faction} faction demands to inspect your cargo.`,

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
      `${enemy.name} moves to intercept. They haven't fired yet.`,
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
    RESOURCES,
    GOODS_AVAILABILITY,
    MISSION_GOLD_RANGES,
    MISSION_ENEMY_RANGES,
    MISSION_REP_IMPACTS,
TRADE_MISSION_PROFIT_MARGINS,
SMUGGLE_PROFIT_MARGINS,
 TRADE_GOODS_BY_TIER,
 SMUGGLE_GOODS_BY_TIER,
    MISSION_NAME_PARTS,
    ENEMY_SHIP_NAMES,
    UPGRADES,
    RANDOM_EVENTS,
    STARTS,
    ENCOUNTER_FLAVOUR,
    SURRENDER_CONSEQUENCE
  };
})();