// ═══════════════════════════════════════════════════════════════════
//  data.js — ALL GAME CONSTANTS (FULLY UPDATED WITH COMBAT MISSIONS)
//  No logic, no functions. Pure data.
//  Exposed as window.D for global access.
// ═══════════════════════════════════════════════════════════════════

window.D = (() => {


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
  //  PORTS: All ports in the Caribbean.
  //  x, y: Coordinates for the map (0-760, 0-460).
  //  faction: Key in FACTIONS.
  //  services: Available services (shipyard, missions, crew).
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const PORTS = {
 
  // ═══════════════════════════════════════════════════
  //  STANDARD — visible and reachable from the start
  // ═══════════════════════════════════════════════════
 
  tortuga: {
    name: "Tortuga", faction: "pirate",
    x: 500, y: 235,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "A lawless haven for pirates and buccaneers. The most notorious port in the Caribbean.",
  },
 
  portDePaix: {
    name: "Port-de-Paix", faction: "french",
    x: 476, y: 248,
    services: ["tavern", "crew", "missions"],
    desc: "A small French port on northern Saint-Domingue, close neighbour to Tortuga.",
  },
 
  petitGoave: {
    name: "Petit-Goâve", faction: "french",
    x: 480, y: 275,
    services: ["tavern", "crew", "missions"],
    desc: "A French buccaneer base on western Saint-Domingue. Rougher and more desperate than Martinique.",
  },
 
  santoDomingo: {
    name: "Santo Domingo", faction: "spanish",
    x: 535, y: 278,
    services: ["tavern", "shipyard", "crew"],
    desc: "The oldest European city in the Americas. A proud Spanish administrative centre on Hispaniola.",
  },
 
  havana: {
    name: "Havana", faction: "spanish",
    x: 340, y: 185,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "Crown jewel of Spanish power in the New World. Heavily fortified and fiercely proud.",
  },
 
  santiagoDeCuba: {
    name: "Santiago de Cuba", faction: "spanish",
    x: 430, y: 245,
    services: ["tavern", "shipyard", "missions"],
    desc: "The second city of Cuba. A waypoint for Spanish convoys heading east toward Hispaniola.",
  },
 
  nassau: {
    name: "Nassau", faction: "pirate",
    x: 415, y: 152,
    services: ["tavern", "crew", "missions"],
    desc: "A loosely governed English settlement in the Bahamas. Rapidly becoming a pirate refuge.",
  },
 
  portRoyal: {
    name: "Port Royal", faction: "english",
    x: 401, y: 275,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "The wealthiest English harbour in the Caribbean. Rebuilt since the great earthquake of 1692.",
  },
 
  kingston: {
    name: "Kingston", faction: "english",
    x: 428, y: 290,
    services: ["tavern", "crew", "missions"],
    desc: "A young town growing in Port Royal's shadow. Modest but honest trade and a welcome harbour.",
  },
 
  portobelo: {
    name: "Portobelo", faction: "spanish",
    x: 355, y: 440,
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
    x: 548, y: 390,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "The jewel of Dutch Caribbean trade. A prosperous free port with a sharp mercantile eye.",
  },
 
  stEustatius: {
    name: "St. Eustatius", faction: "dutch",
    x: 652, y: 290,
    services: ["tavern", "crew", "missions"],
    desc: "The Golden Rock. A Dutch free-trade port where anything can be bought if the price is right.",
  },
 
  martinique: {
    name: "Martinique", faction: "french",
    x: 680, y: 345,
    services: ["tavern", "shipyard", "crew", "missions"],
    desc: "A proud French colony rich in sugar and rum. The most cultivated port in the eastern Caribbean.",
  },
 
  bridgetown: {
    name: "Bridgetown", faction: "english",
    x: 700, y: 375,
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
    x: 195, y: 248,
    minHull: 101,
    services: ["tavern", "shipyard", "missions"],
    desc: "A Gulf of Mexico port famous for logwood. Remote and frequently raided by buccaneers.",
  },
 
  veracruz: {
    name: "Veracruz", faction: "spanish",
    x: 100, y: 258,
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
    x: 302, y: 358,
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
    x: 250, y: 310,
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
    x: 330, y: 158,
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
    x: 718, y: 435,
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
//  slots: Equipment slot counts per type (hull, armament, rigging, special).
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SHIPS = {
  // Tier 0
  dinghy: {
    name: "Dinghy", maxHull: 30, maxCrew: 5, cannons: 2, speed: 6, cost: 200, requiredFame: 0, maxDays: 5, holdCapacity: 20,
    slots: { hull: 0, armament: 0, rigging: 0, special: 0 },
    desc: "A tiny boat. Barely seaworthy, but cheap."
  },

  cutter: {
    name: "Cutter", maxHull: 60, maxCrew: 20, cannons: 6, speed: 12, cost: 1000, requiredFame: 0, maxDays: 8, holdCapacity: 80,
    slots: { hull: 1, armament: 0, rigging: 1, special: 0 },
    desc: "Small, fast, and agile. Excellent for scouting and smuggling."
  },

  // Tier 1
  sloop: {
    name: "Sloop", maxHull: 100, maxCrew: 40, cannons: 10, speed: 11, cost: 4000, requiredFame: 20, maxDays: 10, holdCapacity: 200,
    slots: { hull: 1, armament: 1, rigging: 1, special: 0 },
    desc: "Fast and maneuverable. Ideal for hit-and-run tactics."
  },

  // Tier 2
  schooner: {
    name: "Schooner", maxHull: 110, maxCrew: 55, cannons: 12, speed: 11, cost: 20000, requiredFame: 50, maxDays: 12, holdCapacity: 240,
    slots: { hull: 1, armament: 1, rigging: 1, special: 1 },
    desc: "Favored by smugglers and pirates for its speed and shallow draft."
  },

  merchantman: {
    name: "Merchantman", maxHull: 180, maxCrew: 60, cannons: 5, speed: 8, cost: 25000, requiredFame: 50, maxDays: 14, holdCapacity: 700,
    slots: { hull: 1, armament: 0, rigging: 1, special: 2 },
    desc: "Built for trade, not combat. Large cargo hold, but weak in a fight."
  },

  brigantine: {
    name: "Brigantine", maxHull: 150, maxCrew: 80, cannons: 15, speed: 10, cost: 40000, requiredFame: 50, maxDays: 14, holdCapacity: 448,
    slots: { hull: 1, armament: 1, rigging: 1, special: 1 },
    desc: "Balanced ship with good speed and firepower."
  },

  // Tier 3
  corvette: {
    name: "Corvette", maxHull: 180, maxCrew: 90, cannons: 18, speed: 11, cost: 130000, requiredFame: 100, maxDays: 16, holdCapacity: 500,
    slots: { hull: 1, armament: 1, rigging: 1, special: 1 },
    desc: "A swift naval warship designed to hunt pirates and escort convoys."
  },

  frigate: {
    name: "Frigate", maxHull: 220, maxCrew: 120, cannons: 24, speed: 9, cost: 250000, requiredFame: 100, maxDays: 18, holdCapacity: 720,
    slots: { hull: 1, armament: 1, rigging: 1, special: 1 },
    desc: "A powerful warship with heavy guns and solid endurance."
  },

  fluyt: {
    name: "Fluyt", maxHull: 180, maxCrew: 70, cannons: 6, speed: 7, cost: 100000, requiredFame: 100, maxDays: 24, holdCapacity: 1500,
    slots: { hull: 1, armament: 0, rigging: 1, special: 3 },
    desc: "A Dutch cargo vessel optimized for long-distance trade and massive profits."
  },

  // Tier 4
  galleon: {
    name: "Galleon", maxHull: 300, maxCrew: 150, cannons: 30, speed: 6, cost: 500000, requiredFame: 150, maxDays: 22, holdCapacity: 1000,
    slots: { hull: 1, armament: 1, rigging: 1, special: 2 },
    desc: "The king of the seas. Slow but nearly unstoppable in combat."
  },

  ship_of_the_line: {
    name: "Ship of the Line", maxHull: 420, maxCrew: 280, cannons: 50, speed: 5, cost: 1000000, requiredFame: 150, maxDays: 28, holdCapacity: 900,
    slots: { hull: 1, armament: 2, rigging: 1, special: 1 },
    desc: "A colossal naval fortress capable of dominating entire fleets."
  }
};


const EQUIPMENT = {
  // ── Hull (all structural) ──────────────────────────────────
  reinforced_hull: {
    name: "Reinforced Hull",
    desc: "+20% max hull.",
    downsideDesc: null,
    slot: "hull",
    removable: false,
    requiredFame: 0,
    requiredHull: 0,
    cost: 500,
    installFee: 100,
    effects: { hullPct: 0.20 },
  },
  ironclad_plates: {
    name: "Ironclad Plates",
    desc: "+35% max hull.",
    downsideDesc: "-2 speed.",
    slot: "hull",
    removable: false,
    requiredFame: 50,
    requiredHull: 100,
    cost: 2000,
    installFee: 200,
    effects: { hullPct: 0.35, speed: -2 },
  },
  copper_plating: {
    name: "Copper Plating",
    desc: "+2 speed.",
    downsideDesc: "+40% repair cost.",
    slot: "hull",
    removable: false,
    requiredFame: 100,
    requiredHull: 150,
    cost: 3500,
    installFee: 300,
    effects: { speed: 2, repairCostPct: 0.40 },
  },
  tar_sealed_hull: {
    name: "Tar-Sealed Hull",
    desc: "+2 max days at sea. Prevents calm wind delays.",
    downsideDesc: "-1 speed.",
    slot: "hull",
    removable: false,
    requiredFame: 20,
    requiredHull: 60,
    cost: 1200,
    installFee: 150,
    effects: { maxDays: 2, speed: -1, calmImmune: true },
  },

  // ── Armament (all removable) ───────────────────────────────
  extra_cannons: {
    name: "Extra Cannons",
    desc: "+4 cannons.",
    downsideDesc: "-1 speed.",
    slot: "armament",
    removable: true,
    requiredFame: 20,
    requiredHull: 60,
    cost: 800,
    installFee: 50,
    effects: { cannons: 4, speed: -1 },
  },
  grapeshot_supply: {
    name: "Grapeshot Supply",
    desc: "+50% crew damage to enemy.",
    downsideDesc: "-20% hull damage to enemy.",
    slot: "armament",
    removable: true,
    requiredFame: 50,
    requiredHull: 100,
    cost: 1800,
    installFee: 100,
    effects: { crewDmgPct: 0.50, hullDmgPct: -0.20 },
  },
  long_guns: {
    name: "Long Guns",
    desc: "Precision hit chance 70% → 80%.",
    downsideDesc: "-2 cannons.",
    slot: "armament",
    removable: true,
    requiredFame: 100,
    requiredHull: 150,
    cost: 3000,
    installFee: 150,
    effects: { cannons: -2, precisionHitPct: 0.10 },
  },

  // ── Rigging ────────────────────────────────────────────────
  extra_sails: {
    name: "Extra Sails",
    desc: "+3 speed.",
    downsideDesc: "-10% max hull.",
    slot: "rigging",
    removable: true,
    requiredFame: 0,
    requiredHull: 60,
    cost: 600,
    installFee: 50,
    effects: { speed: 3, hullPct: -0.10 },
  },
  storm_rigging: {
    name: "Storm Rigging",
    desc: "+2 max days at sea. Prevents storm hull damage.",
    downsideDesc: "-1 speed.",
    slot: "rigging",
    removable: true,
    requiredFame: 20,
    requiredHull: 60,
    cost: 900,
    installFee: 75,
    effects: { maxDays: 2, speed: -1, stormHullImmune: true },
  },
  lateen_rig: {
    name: "Lateen Rig",
    desc: "+1 max days at sea.",
    downsideDesc: "-10% max hull.",
    slot: "rigging",
    removable: false,
    requiredFame: 50,
    requiredHull: 100,
    cost: 1500,
    installFee: 150,
    effects: { maxDays: 1, hullPct: -0.10 },
  },
  war_pennants: {
    name: "War Pennants",
    desc: "+1 fame from combat/patrol/assault mission victories.",
    downsideDesc: "Heat from those victories doubled.",
    slot: "rigging",
    removable: true,
    requiredFame: 100,
    requiredHull: 100,
    cost: 3500,
    installFee: 150,
    effects: { missionCombatFameBonus: 1, combatHeatMult: 2 },
  },

  // ── Special ────────────────────────────────────────────────
  expanded_hold: {
    name: "Expanded Hold",
    desc: "+20% hold capacity.",
    downsideDesc: "-2 speed.",
    slot: "special",
    removable: true,
    requiredFame: 0,
    requiredHull: 60,
    cost: 700,
    installFee: 50,
    effects: { holdPct: 0.20, speed: -2 },
  },
  hidden_compartment: {
    name: "Hidden Compartment",
    desc: "50% chance contraband is not detected on inspection.",
    downsideDesc: "-10% hold capacity.",
    slot: "special",
    removable: false,
    requiredFame: 20,
    requiredHull: 60,
    cost: 1000,
    installFee: 100,
    effects: { contrabandAvoidChance: 0.50, holdPct: -0.10 },
  },
  surgeons_bay: {
    name: "Surgeon's Bay",
    desc: "-40% crew loss in combat.",
    downsideDesc: "-15% hold capacity.",
    slot: "special",
    removable: true,
    requiredFame: 50,
    requiredHull: 100,
    cost: 2000,
    installFee: 100,
    effects: { crewLossMult: 0.60, holdPct: -0.15 },
  },
  officer_quarters: {
    name: "Officer Quarters",
    desc: "+10 max crew.",
    downsideDesc: "-20% hold capacity.",
    slot: "special",
    removable: true,
    requiredFame: 50,
    requiredHull: 100,
    cost: 1800,
    installFee: 100,
    effects: { maxCrew: 10, holdPct: -0.20 },
  },
  ornate_figurehead: {
    name: "Ornate Figurehead",
    desc: "+2 positive reputation gain from missions.",
    downsideDesc: null,
    slot: "special",
    removable: true,
    requiredFame: 0,
    requiredHull: 0,
    cost: 300,
    installFee: 25,
    effects: { repGainBonus: 2 },
  },
  navigation_tools: {
    name: "Navigation Tools",
    desc: "-1 travel day if base voyage is > 4 days.",
    downsideDesc: null,
    slot: "special",
    removable: true,
    requiredFame: 50,
    requiredHull: 60,
    cost: 600,
    installFee: 50,
    effects: { longVoyageDayReduction: 1 },
  },
};



  

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
  0: { low: [75,120],   medium: [120,160],   high: [160,200],   assault: [200,280] },
  1: { low: [140,180],  medium: [180,230],   high: [230,300],   assault: [300,400] },
  2: { low: [400,1500], medium: [1500,5000], high: [5000,7000], assault: [7000,10000] },
  3: { low: [2000,7000],medium: [7000,10000],high: [10000,18000],assault: [18000,22000] },
  4: { low: [6000,15000],medium:[15000,30000],high: [30000,50000],assault: [50000,75000] },
  5: { low: [15200,25000],medium:[25000,50000],high: [50000,80000],assault: [80000,100000] },
};

const MISSION_ENEMY_RANGES = {
  hull:    { 0:[12,22],  1:[20,45],  2:[40,75],  3:[65,110], 4:[95,155],  5:[135,210] },
  cannons: { 0:[1,3],    1:[2,6],    2:[5,10],   3:[8,16],   4:[13,22],   5:[18,30] },
  crew:    { 0:[3,8],    1:[8,18],   2:[15,35],  3:[25,55],  4:[40,80],   5:[60,110] },
};

// Plunder balance tuning
const PLUNDER_TARGET = {
  0: { low: 15,   medium: 20,   high: 28 },
  1: { low: 27,   medium: 34,   high: 41 },
  2: { low: 285,  medium: 975,  high: 1800 },
  3: { low: 1350, medium: 2550, high: 4200 },
  4: { low: 3150, medium: 6750, high: 12000 },
  5: { low: 6030, medium: 11250,high: 19500 },
};

const PLUNDER_GOLD_RATIO = 0.20; // 20% gold, 80% cargo value

const FACTION_PLUNDER_GOODS = {
  spanish: [
    { good: "silver", weight: 60 },
    { good: "cocoa",  weight: 30 },
    { good: "spices", weight: 10 },
  ],
  pirate: [
    { good: "rum",     weight: 50 },
    { good: "weapons", weight: 30 },
    { good: "tobacco", weight: 20 },
    { good: "slaves",  weight: 10 },
  ],
  english: [
    { good: "cloth",   weight: 50 },
    { good: "weapons", weight: 30 },
    { good: "sugar",   weight: 20 },
  ],
  dutch: [
    { good: "spices", weight: 40 },
    { good: "silk",   weight: 30 },
    { good: "coffee", weight: 20 },
    { good: "cocoa",  weight: 10 },
  ],
  french: [
    { good: "sugar",  weight: 40 },
    { good: "cocoa",  weight: 30 },
    { good: "rum",    weight: 20 },
    { good: "coffee", weight: 10 },
  ],
};

const MISSION_REP_IMPACTS = {
  escort:  { low: 2, medium: 3, high: 4 },
  patrol:  { low: 2, medium: 3, high: 4 },
  combat:  { low: 3, medium: 4, high: 5 },
  trade:   { low: 2, medium: 3, high: 4 },
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

const PATROL_FINE_RATE = 0.50; // Fine = 50% of seized contraband base value

const TRADE_GOODS_BY_TIER = {
  0: ["rum", "sugar", "timber"],
  1: ["rum", "sugar", "timber", "cloth"],
  2: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa"],
  3: ["coffee", "cocoa", "cloth", "weapons", "spices"],
  4: ["spices", "silk", "weapons", "cocoa"],
  5: ["spices", "silk", "weapons", "cocoa"],
};

const SMUGGLE_GOODS_BY_TIER = {
  0: ["rum"],
  1: ["rum", "tobacco"],
  2: ["rum", "tobacco"],
  3: ["rum", "tobacco", "slaves"],
  4: ["rum", "tobacco", "slaves"],
  5: ["rum", "tobacco", "slaves"],
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
      desc: [
          "A violent storm batters the ship! Waves break over the bow.",
          "Dark clouds roll in without warning. The storm is upon you.",
          "A squall hits hard and fast. The crew scrambles to secure the rigging.",
        ],
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
      desc: [
  "The wind dies completely. The sails hang limp.",
  "Not a breath of wind. The ship sits motionless under a blazing sun.",
  "Dead calm. The sea is glass and the heat is unbearable.",
],
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
  id: "distressed_merchant",
  type: "choice",
  title: "Merchant in Distress",
  desc: [
  "A merchant ship flies a signal of distress. Pirates are closing in.",
  "Smoke rises from a vessel under attack. A merchant signals for help.",
  "A panicked merchant captain waves a white flag as raiders circle their ship.",
],
  condition: (state) => state.screen === "sailing",
  choices: [
    {
      label: "Defend the Merchant (Attack Pirates)",
      outcome: {
        action: "ATTACK_PIRATE",
        log: "You steer towards the pirates, ready to defend the merchant."
      }
    },
    {
      label: "Plunder the Merchant",
      outcome: {
        action: "ATTACK_MERCHANT",
        log: "You see an opportunity. The merchant is easy prey."
      }
    },
    {
      label: "Pass By",
      outcome: {
        log: "You leave them to their fate.",
        moralePenalty: 2
      }
    }
  ]
},

    {
      id: "drifting_wreck",
      type: "choice",
      title: "Drifting Wreck",
      desc: [
  "A damaged ship drifts in the current, hull split and sails in tatters.",
  "A derelict vessel wallows in the swell, its crew long gone.",
  "You spot a wreck adrift — broken masts, silent decks.",
],
      condition: (state) => state.screen === "sailing",
      choices: [
        {
          label: "Search the wreck (risky)",
          outcome: {
            action: "RESOLVE_DRIFTING_WRECK_SEARCH",
            log: "You bring your ship alongside and send a party aboard..."
          }
        },
        {
          label: "Leave it be",
          outcome: {
            log: "You leave the wreck to the mercy of the sea. The crew watches it drift past in silence."
          }
        }
      ]
    },


{
  id: "drifting_sailors",
  type: "choice",
  title: "Marooned Sailors",
  desc: [
  "A small boat hails you. Three sunburnt sailors beg for passage.",
  "Castaways wave frantically from a leaking jolly boat.",
  "Three desperate souls drift in a battered skiff, nearly out of water.",
],
  condition: (state) => state.fame >= 10,
  choices: [
    {
      label: "Take them aboard",
      outcome: {
        addCrew: {
          count: 3,
          faction: null,      // random faction
          tags: [],
          negativeTagChance: 0.40,
        },
        log: "You take the sailors aboard. They seem grateful... for now."
      }
    },
    {
      label: "Give them supplies and gold (50g)",
      outcome: {
        gold: -50,
        moraleBonus: 3,
        log: "You give them gold and provisions for passage to the nearest port. The crew approves of your mercy."
      }
    },
    {
      label: "Sail on",
      outcome: {
        moraleBonus: -1,
        log: "You leave them to their fate. A few crew members look away."
      }
    }
  ]
},


    // Reward events
    {
      id: "treasure_map",
      type: "reward",
      title: "Treasure Map Found!",
      desc: [
  "You discover a tattered map in a waterproof case. It marks a hidden cove.",
  "A scrap of parchment flutters from a dead sailor's hand. It's a treasure map.",
  "Tucked inside an old logbook, you find a hand‑drawn chart with an 'X' on it.",
],
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
      desc: [
  "A pod of whales surfaces near your ship. The crew watches in wonder.",
  "Massive spouts erupt off the bow — whales, dozens of them.",
  "Whales breach alongside the ship. A good omen, some say.",
],
      choices: [
        {
          label: "Harvest the whales",
          outcome: {
            log: "You harvest whale oil to sell in port.",
            gold: 500,
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
      desc: [
  "The crew has had enough. Angry voices demand changes — now.",
  "A group of sailors confronts you on the quarterdeck. This is mutiny.",
  "Whispers have turned to shouts. The crew is on the brink of revolt.",
],
      choices: [
        {
          label: "Negotiate",
          outcome: {
            log: "You promise better conditions. The crew stands down... for now.",
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
      desc: [
  "Several crew members are missing this morning. They slipped away in the night.",
  "Your bosun reports empty hammocks. Deserters, no doubt.",
  "A jolly boat is gone. So are a handful of sailors who couldn't take any more.",
],
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
      label: "Buy the chart (‑5000g)",
      outcome: {
        gold: -5000,
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
  //  STARTS: Starting content for new games.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const STARTS = {
  // ── Faction → Starting Port ────────────────────────────
  factionPorts: {
    english: "portRoyal",
    spanish: "havana",
    french: "petitGoave",
    dutch: "santoDomingo",
    pirate: "santiagoDeCuba",
  },

  // ── Faction → Reputation Adjustments ───────────────────
  factionRepAdjust: {
    english: { english: +10, pirate: -5 },
    spanish: { spanish: +10, english: -5 },
    french:  { french: +10, english: -5 },
    dutch:   { dutch: +10, spanish: -5 },
    pirate:  { pirate: +10, spanish: -5 },
  },

  // ── Faction → Backstory Fragments ─────────────────────
  factionBackstory: {
    english: {
      hook: "a forged commission and a borrowed tide",
      flavour: "The ink is passable. The signature is not. You need to become the kind of captain who doesn't need the letter before someone looks closely enough to notice.",
      openingLog: [
        "Cleared Port Royal on a borrowed tide. The harbormaster stamped my commission without reading it. He never reads them.",
        "I need a real reputation before someone calls my bluff. That means work. English work, legal work — at least for now.",
      ],
    },
    spanish: {
      hook: "a sealed crate and a debt you didn't ask for",
      flavour: "The crate makes no sound. It's heavier than it looks. You've decided not to think about it. After the first delivery, you'll know if you have a choice in any of this.",
      openingLog: [
        "Don Luis watched the harbour from his window this morning. I did not look back when I cast off.",
        "First delivery: Santiago de Cuba. After that, I'll know if I have a choice in any of this.",
      ],
    },
    french: {
      hook: "a dead man's charts and a contract you inherited",
      flavour: "Your mentor left you his instruments, his dinghy, and a six-month charting contract the navy has already paid for. The navy wants charts. You want freedom. Both require moving.",
      openingLog: [
        "Deschamps's charts are better than anything the navy has. That's why they want them finished. That's also why I have leverage, if I'm careful.",
        "The naval officer said 'by the agreed date' twice. The date is in six months. I have time — if I keep moving.",
      ],
    },
    dutch: {
      hook: "a company ledger and a quota that won't meet itself",
      flavour: "You found a discrepancy in a senior partner's account. You were 'promoted' to independent contractor within the week. The freedom is real enough. The accounting isn't.",
      openingLog: [
        "The Company gave me a list of contacts. Petit-Goâve is on it. I did not expect Petit-Goâve.",
        "The freedom is real enough. It's the accounting that isn't free.",
      ],
    },
    pirate: {
      hook: "a shipwreck, a friend, and nothing else",
      flavour: "The storm took the ship and everyone on it except you. You made port on the fifth day. You have two years of knowledge, a dinghy, and no particular loyalty to anyone.",
      openingLog: [
        "Tortuga smells like rum and bad decisions. I've missed it.",
        "Two years of watching from the deck. I know the routes. I know the prices. I know the mistakes people make. Now I find out if knowing is enough.",
      ],
    },
  },

  // ── Faction → Quartermaster Names ──────────────────────
 factionQM: {
  english: { firstName: "Old",     lastName: "Morley",     bio: "A weathered English bosun who's seen more voyages than he cares to count. Keeps the crew in line with a steady glare and a steadier hand." },
  spanish: { firstName: "Viejo",   lastName: "Cortés",     bio: "A grizzled Spanish veteran who fought under the flag before he traded it for something less particular. Knows every reef in these waters." },
  french:  { firstName: "Vieux",   lastName: "Deschamps",  bio: "A seasoned French mariner who served as quartermaster on three ships — two of them still afloat. Quiet, competent, and utterly unsentimental." },
  dutch:   { firstName: "Oude",    lastName: "Bakker",     bio: "A practical Dutch quartermaster who treats a ship's ledger with the same precision as a surgeon's knife. Doesn't say much, but when he does, listen." },
  pirate:  { firstName: "Scarred", lastName: "Jim",        bio: "No one remembers Jim's real name, or what he looked like before the scars. He's been aboard more pirate crews than he can recall, and he's one of the few who can still recall anything at all." },
},

  // ── Universal Starting Conditions ─────────────────────
  gold: 490,
  ship: "dinghy",
  hold: { food: 8, water: 8 },
  startDate: { day: 1, month: 6, year: 1695 },
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
    FACTIONS,
    PORTS,
    SHIPS,
    EQUIPMENT,
    RESOURCES,
    GOODS_AVAILABILITY,
    MISSION_GOLD_RANGES,
    MISSION_ENEMY_RANGES,
    PLUNDER_TARGET,
    PLUNDER_GOLD_RATIO,
    FACTION_PLUNDER_GOODS,
    MISSION_REP_IMPACTS,
    TRADE_MISSION_PROFIT_MARGINS,
    SMUGGLE_PROFIT_MARGINS,
    TRADE_GOODS_BY_TIER,
    SMUGGLE_GOODS_BY_TIER,
    PATROL_FINE_RATE,
    RANDOM_EVENTS,
    STARTS,
    SURRENDER_CONSEQUENCE,
  };
})();