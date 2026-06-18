// data_text.js : All text constants for Broadside
// Extends window.D with pure text data.
// Must be loaded AFTER data.js.

(() => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Crew Name Pools
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Bio Templates
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 const BIO_OPENINGS = {
  newHand: [
  `{fn} is new aboard. Time will tell what kind of sailor they are.`,
  `{fn}, a {factionLabel} {role}, is still finding their place among the crew.`,
  `The new {role} from {factionLabel} waters keeps their head down. Early days.`,
  `{fn} signed on recently. A quiet {role}...  for now.`,
  `{fn} came aboard from {factionLabel} territory. The crew hasn't made up its mind yet.`,
  `{fn} is the newest face on deck. No one really knows them yet.`,
  `Fresh off the dock, {fn} is eager to prove themselves.`,
  `{fn} joined the crew only a few days ago. Still learning every rope.`,
  ],
  settling: [
    `{fn} has been aboard {days} days. Starting to learn the ropes.`,
    `After {days} days, {fn} is fitting in. A decent {role} by all accounts.`,
    `{fn}, the {factionLabel} {role}, has been here {days} days. No complaints so far.`,
    `The {role} from {factionLabel} ports is settling in. {days} days and counting.`,
    `{fn} joined {days} days ago. The crew has accepted them.`,
  ],
  seasoned: [
    `{fn} is a seasoned hand with {days} days at sea on this ship.`,
    `After {days} days, {fn} knows every plank and rope. A reliable {role}.`,
    `{fn}, the {factionLabel} {role}, has earned respect after {days} days aboard.`,
    `The crew trusts {fn}. {days} days at sea makes a {role} dependable.`,
    `A seasoned {role} from {factionLabel} waters, {fn} has served {days} days.`,
  ],
  veteran: [
    `{fn} is a veteran of {days} days. The crew looks up to them.`,
    `After {days} days, {fn} is one of the most experienced hands aboard.`,
    `{fn}, a {factionLabel} {role} and veteran of {days} days, is someone the crew turns to in a crisis.`,
    `The {role} they call {fn} has been here {days} days. A quiet authority.`,
    `{fn} has served {days} days. Few aboard remember the ship without them.`,
  ],
  oldSalt: [
    `{fn} has served {days} days. This ship is their life now.`,
    `After {days} days, {fn} is part of the ship itself. An old salt through and through.`,
    `{fn}, the {factionLabel} {role}, has been aboard longer than most can remember. {days} days.`,
    `They say {fn} was born on this deck. {days} days and still counting.`,
    `The old {role} they call {fn} has {days} days aboard. This ship is home.`,
  ],
};


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Port Gossip Templates
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PORT_GOSSIP_TEMPLATES = {

  // ── HEAT (Priority 3) ─────────────────────────────────────────────
  heat: {
    medium: [
      "The harbourmaster checks papers more carefully than usual. Extra soldiers loiter near the quay.",
      "A pair of guards watch you from the shade of a warehouse. They don't approach, but they don't look away.",
      "Someone has posted a description on the notice board. It could be anyone, really.",
      "The dockworkers are quieter than usual. An officer is making rounds.",
    ],
    high: [
      "Warships sit in the harbour, crews at the ready. They're looking for someone. Possibly you.",
      "Every soldier you pass studies your face. The garrison is on full alert.",
      "The harbour battery is manned and the chains across the harbour mouth are raised.",
      "A patrol stops you before you've walked twenty paces. They let you go.. this time.",
    ],
  },

  // ── CONTRABAND (Priority 3) ───────────────────────────────────────
  contraband: [
    "A customs officer lingers near your berth, nose in the air. He knows something.",
    "Dockworkers glance at your hold with knowing eyes. Word travels fast on the docks.",
    "The smell from your hold is drawing attention. Not the good kind.",
    "A harbour official is checking manifests more thoroughly than usual. You're glad he hasn't reached your slip yet.",
  ],

  // ── REPUTATION (Priority 2) ───────────────────────────────────────
  reputation: {
    at_war: [
      "Armed men watch your every move. You are not welcome here.",
      "The harbourmaster spits as you pass. 'Sail out while you still can.'",
    ],
    hostile: [
      "The harbourmaster's greeting is ice cold. Your papers are checked twice.",
      "Merchants pull their children inside as you walk past. Word has spread.",
      "'Keep your business quick,' a dockhand mutters. 'Nobody wants you here.'",
    ],
    neutral: [
      "Nobody pays you special attention. Just another ship in port.",
      "A few dockworkers nod as you pass. Nothing more, nothing less.",
      "The harbourmaster stamps your papers without looking up. Routine business.",
    ],
    friendly: [
      "The dockmaster nods in recognition. Your usual berth is ready.",
      "A merchant you've dealt with before waves from across the quay.",
      "Someone buys you a drink before you've even asked. Good to be back.",
    ],
    allied: [
      "Merchants approach before you've tied off. Your name opens doors in this port.",
      "The harbourmaster personally welcomes you. 'Anything you need, Captain.'",
      "Children wave your colours. Sailors raise a glass. A hero's welcome.",
    ],
  },

  // ── FAME (Priority 2) ─────────────────────────────────────────────
  fame: {
    unknown: [
      "Nobody recognises you. Just another captain scraping by.",
      "A tavern keeper asks your name twice. It doesn't stick.",
    ],
    emerging: [
      "A few sailors nod in recognition. You've been making a name.",
      "Someone in the tavern whispers your name. They know your ship.",
    ],
    recognised: [
      "Tavern conversations pause as you pass. People know your ship.",
      "'That's the one,' a dockworker says to his mate. They step aside.",
      "A young sailor asks if the stories about you are true. You let him wonder.",
    ],
    notorious: [
      "Children point at your flag. Sailors trade stories about you, and some of them are true.",
      "A crowd gathers when you come ashore. They want to see if the legends match.",
      "The tavern keeper refuses your coin. 'Your money's no good here, Captain. Tell us a tale instead.'",
    ],
    legendary: [
      "Your arrival is the talk of the port. Captains raise a glass in your honour.",
      "A painter sketches your ship from the quay. He says it'll sell in every port in the Caribbean.",
      "The governor sends a messenger with compliments and a request for a private audience.",
    ],
  },

  // ── INFAMY (Priority 2) ───────────────────────────────────────────
  infamy: {
    low: [
      "A wanted notice on the tavern wall bears a description that could be yours.",
      "Someone studies your face a moment too long. Then looks away.",
    ],
    medium: [
      "People avoid eye contact. Your reputation precedes you, but not in a good way.",
      "A barmaid serves you quickly and retreats. She's heard the stories.",
      "No one sits at the table next to yours. They prefer the distance.",
    ],
    high: [
      "The constable watches from the dock. You feel the noose tightening.",
      "Wanted posters with your name are nailed to the customs house door.",
      "A bounty hunter in the corner pretends not to see you. He's waiting for the right moment.",
    ],
    extreme: [
      "Every colonial power wants you dead. The question is who gets there first.",
      "The crowd parts when you walk. Not out of respect but out of fear.",
      "A child asks if you're really the devil. His mother pulls him away before you can answer.",
      "The tavern falls silent when you enter. The bravest man in the room is the one who serves your drink.",
    ],
  },

  // ── AMBIANCE (Priority 0) : Faction-specific ──────────────────────
  ambiance: {
    english: [
      "The smell of tar and tobacco drifts from the shipyard.",
      "English sailors argue over cards in the shade of a warehouse.",
      "A preacher on the dock warns of God's judgment. Nobody is listening.",
      "Redcoats drill in the square, muskets gleaming in the afternoon sun.",
    ],
    spanish: [
      "Church bells echo across the harbour. Mass has just ended.",
      "The scent of coffee and gunpowder hangs in the humid air.",
      "A line of soldiers marches past, breastplates shining.",
      "A priest blesses a fishing boat. The fishermen cross themselves.",
    ],
    french: [
      "The sound of French drifts from the tavern, mixed with laughter and breaking glass.",
      "Buccaneers lounge on the dock, sharpening knives and lying about their catches.",
      "A woman sells fresh fruit from a cart. The mangoes look almost worth the price.",
      "Someone is playing a violin. Someone else is singing along badly.",
    ],
    dutch: [
      "Merchants crowd the counting houses, ledgers open, voices sharp.",
      "The harbour is immaculate. Even the bollards look polished.",
      "Crates stamped VOC are stacked three-high on the quay.",
      "A clerk argues with a captain about a quarter-percent tariff. Neither will yield.",
    ],
    pirate: [
      "The tavern is already loud, and the sun hasn't set yet.",
      "A man with more scars than teeth offers to sell you a map. It's clearly fake.",
      "Someone is playing a fiddle badly. Someone else is enjoying it even worse.",
      "Two pirates arm-wrestle over a disputed bet. A small crowd takes sides.",
    ],
  },

  // ── WEATHER (Priority 0)  Faction-agnostic filler ────────────────
  weather: [
    "A warm breeze carries the smell of salt and tar.",
    "Storm clouds gather on the horizon. The old sailors are watching.",
    "The heat is oppressive. Even the dogs have found shade.",
    "A light rain falls, turning the dock planks slippery.",
    "The sunset paints the harbour gold. For a moment, even the pirates stop to look.",
  ],
  
  // ── HIDDEN PORT HINTS (Priority 1) ────────────────────────────────
  // Shown when player is close to (but hasn't met) unlock conditions.
  //
  // Roatan:      fame >= 50 OR pirate rep >= 65
  // Dry Tortugas: infamy >= 25 AND pirate rep >= 65
  // Las Aves:    map_fragment_lasAves (from Wrecker's Map event, fame >= 50)
  // Libertalia:  fame >= 200 AND map_fragment_libertalia (from Dying Sailor event, fame >= 100)
  hiddenPorts: {
    roatan: "Old sailors speak of a hidden cove in the Bay Islands. 'You need a name worth knowing, or friends on the Account to find it,' they say.",
    dryTortugas: "A drunk pirate mumbles about islands at the tip of Florida. 'You need to be one of us to find the channel,' he slurs.",
    lasAves: "A marooned marin nurses his drink alone. He holds a tattered nautical charts firmly in his hand.",
    libertalia: "A dying sailor's tale keeps surfacing in tavern talk. A tale about a free republic, somewhere far south, where pirates live like kings.",
  },

  // ── MARKET (Priority 1) ───────────────────────────────────────────
  // Template variables: {good} = lowercase, {Good} = capitalised
  // NOTE: Generator must skip "slaves" : no market gossip for slaves.
  // NOTE: If you want to add harvest-specific lines later, tag them as
  //       organic:true and filter in the generator. Organic goods:
  //       sugar, coffee, cocoa, tobacco, timber, cloth, rum.
  market: {
    surplus: [
      "Warehouses overflow with {good}. A buyer's market if ever there was one.",
      "{Good} is cheap here and the docks are stacked with it.",
      "A recent convoy flooded the market with {good}. Prices have dropped sharply.",
      "Merchants are practically giving {good} away. Supply far outstrips demand.",
    ],
    shortage: [
      "There's a shortage of {good}. Merchants are paying premium for anyone with a hold full.",
      "{Good} is scarce. 'Haven't seen a shipment in weeks,' a merchant complains.",
      "Everyone's looking for {good}. If you've got some, you'll name your price.",
      "The last {good} shipment was lost at sea. Prices are climbing fast.",
    ],
  },
};


const MARKET_FLAVOUR = {
  // Gold (rare occurrence by generator)
  gold_rich: [
    "Gold enough to buy the whole market and the merchants know it.",
    "Merchants practically trip over themselves when you approach.",
  ],
  gold_comfortable: [
    "You have enough coin to command respect, but not enough to be careless.",
    "Your purse feels comfortably heavy. The stall‑keepers notice.",
  ],

  // Hold fullness
  hold_empty: [
    "Your hold is empty. Every barrel and crate you see looks like an opportunity.",
    "The ship’s belly is as hollow as a drum. Time to fill it.",
    "You walk the market with a hold begging for cargo.",
    "Nothing but ballast and echoes in the hold. The market calls.",
  ],
  hold_light: [
    "A few crates sit in the hold. Room enough for a profitable run.",
    "Your hold is light. A few choice purchases will keep the ship nimble.",
    "Plenty of space below decks. You can afford to browse.",
    "The hold could take more without slowing the ship.",
  ],
  hold_half: [
    "The hold is filling up. You’re starting to feel the weight of each new barrel.",
    "Half‑full holds make for careful choices. Every crate matters now.",
    "You’ve got a solid cargo. A little more won’t hurt... or will it?",
    "The ship sits a little lower in the water. Halfway there.",
  ],
  hold_full: [
    "The hold is nearly bursting. You could still squeeze in a few more sacks, but the ship will feel it.",
    "Cargo towers in the hold. The bosun shakes his head at every new purchase.",
    "One more barrel and the rats will have to move out. The hold is packed.",
    "You’re hauling as much as you dare. A few more crates and the ship will groan.",
  ],

  // Extreme prices (reuse same detection as gossip)
  price_surplus: [
    "{Good} is practically being given away here. The warehouses must be overflowing.",
    "You’ve never seen {good} this cheap. The market is flooded with it.",
    "Merchants are desperate to offload {good}. It’s a buyer’s paradise.",
    "The price of {good} has collapsed. You could buy a shipful for a song.",
  ],
  price_shortage: [
    "{Good} is scarce and the merchants are guarding every crate like a treasure.",
    "Everyone wants {good}. The merchants are naming their price.",
    "You hear talk of a shortage. {Good} hasn’t been this dear in months.",
    "The stall owners shake their heads when you ask about {good}. Supplies are thin.",
  ],

  // Rare goods
  rare_good: [
    "You spot {good} on a stall. It is a rare sight in this port. The merchant knows what they have.",
    "Is that {good}? You don’t see that every voyage. The price reflects it.",
    "A few crates of {good} sit tucked behind the counter. The merchant smiles knowingly.",
    "Rare cargo, {good}, sits in plain sight. The merchant watches your reaction.",
  ],

  // Good‑specific lines (just 1 variant each)
  tobacco_present: [
    "Bundles of tobacco leaves hang from the rafters, their sweet‑sharp scent unmistakable.",
  ],
  slaves_present: [
    "You turn away from the slave pens. The market may sell them, but you don’t have to look.",
  ],

  // Fame (low priority)
  fame_recognised: [
    "Merchants call out as you pass, your name carries weight here.",
    "A few stall‑keepers greet you by name. Your reputation precedes you.",
    "You catch traders watching you with a mix of respect and calculation.",
  ],
  fame_legendary: [
    "The crowd parts as you approach. Even the merchants pause to look.",
    "You don’t need to haggle, your name settles the price.",
    "A young trader asks for your autograph. Word of your deeds has spread far.",
  ],

  // Infamy (low priority)
  infamy_wanted: [
    "A few merchants avoid your gaze. Your reputation is a complicated asset.",
    "The stall‑keepers deal with you quickly, eager to move on.",
    "No one says it, but they know who you are... and what you’ve done.",
  ],
  infamy_notorious: [
    "The market falls quiet as you pass. Only the bravest merchants meet your eye.",
    "No one calls out. No one offers a sample. They just want you to leave.",
    "A child whispers as you pass: 'That’s the one from the wanted posters.'",
  ],

  // Port atmosphere by faction (fallback ambiance)
  port_english: [
    "The market at {port} runs with the clipped efficiency of a naval ship.",
    "Redcoats patrol the perimeter, but the merchants seem used to it.",
  ],
  port_spanish: [
    "The scent of coffee and gunpowder drifts through {port}’s market.",
    "A priest blesses a stall. The man crosses himself and pockets the merchant’s coin.",
  ],
  port_french: [
    "The market of {port} is a riot of colour and chatter, with goods from across the islands.",
    "Someone is singing and playing a violin. Someone else is arguing loudly. Both sound French.",
  ],
  port_dutch: [
    "The stalls at {port} are orderly, the merchants sharp‑eyed and precise.",
    "Ledgers sit open on every counter and every coin is accounted for.",
  ],
  port_pirate: [
    "At {port}, the market is a glorious chaos of stolen goods and tall tales.",
    "No one asks where anything came from. No one wants to know.",
  ],

  // Fallback ambiance , always available
  ambiance: [
    "The scent of spices and old timber fills the market square.",
    "Gulls cry overhead as merchants shout their prices.",
    "A warm breeze carries the smell of fresh fruit and tar.",
    "The market bustles with sailors haggling over every last coin.",
    "You weave through stacks of crates and barrels, the heartbeat of {port}.",
    "Every stall tells a story. Some are honest but most are not.",
  ],
};



  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Mission Name Parts
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MISSION_NAME_PARTS = {
  cargo:      ["spice shipment","merchant convoy","supply fleet","noble passenger","silver bullion","colonial goods","textile cargo","grain stores"],
  contraband: ["rum","stolen charts","black powder","foreign silk","untaxed tobacco","opium","illegal firearms","forbidden books"],
  regionAdj:  ["southern","northern","treacherous","disputed","windward","leeward","inner","outer"],
  factionAdj: {
    english: ["English","Crown","His Majesty's","Royal"],
    spanish: ["Spanish","Colonial","Crown","Viceroyalty"],
    french:  ["French","Republican","Gallic","Louis'"],
    dutch:   ["Dutch","Company","Merchant","West India"],
    pirate:  ["Brotherhood","Free","Account","Brethren"],
  },
};


// ── Combat Log Templates ──────────────────────────────────────
const COMBAT_LOG_TEMPLATES = {
  player: {
    broadside: [
      "Your broadside thunders across the waves, dealing {hull} hull damage and sweeping {crew} crew from the deck.",
      "A full volley crashes into the enemy: {hull} to the hull, {crew} sailors lost.",
      "Cannons roar in unison – {hull} hull damage, {crew} crew cut down.",
      "The broadside lands true. {hull} hull integrity gone, {crew} enemy crew fall.",
    ],
    precision_hit: [
      "Your precision shot finds its mark, tearing {hull} from the hull and killing {crew} crew.",
      "Aimed and fired – the shot hits home. {hull} hull damage, {crew} crew down.",
      "The gun crew cheers as the precision strike lands, dealing {hull} hull damage and {crew} casualties.",
      "Right through the gunports! {hull} hull damage, {crew} enemy sailors lost.",
    ],
    precision_miss: [
      "Your precision shot splashes harmlessly into the sea.",
      "The aimed shot goes wide. Nothing but spray.",
      "You overcorrect and miss cleanly.",
      "The cannonball flies past the enemy’s rigging. A miss.",
    ],
    grapple_success: [
      "You bring the ships together and board! The enemy vessel is yours.",
      "Grapples fly and your crew swarms over the rail. Victory!",
      "You close the distance and your boarders overwhelm them. The enemy ship is taken.",
      "Hooks bite into timber – you board and claim the prize!",
    ],
    grapple_fail: [
      "Your grapple fails and you lose {crew} crew in the attempt.",
      "The enemy repels your boarders. {crew} of your sailors are cut down.",
      "They fight off the grapple and you retreat, {crew} crew lighter.",
      "The boarding action is thrown back. {crew} crew lost in the chaos.",
    ],
    evade_success: [
      "You slip away into the smoke and escape!",
      "You disengage cleanly. The enemy is left behind.",
      "A quick turn and you’re gone. They won’t catch you today.",
      "You outrun them and vanish into the open sea.",
    ],
    evade_fail: [
      "Evade fails! The enemy stays on your heels.",
      "You try to flee but they match your speed.",
      "No escape – they’re faster than you hoped.",
      "You can’t shake them. The fight continues.",
    ],
  },
  npc: {
    broadside: [
      "The enemy's broadside slams into your hull: {hull} damage, {crew} crew lost.",
      "A return volley crashes home – {hull} hull, {crew} sailors down.",
      "Their cannons speak. {hull} hull damage, {crew} crew casualties.",
      "Fire and splinters: {hull} to the hull, {crew} crew swept away.",
    ],
    precision_hit: [
      "The enemy's precision shot punches through – {hull} hull damage, {crew} crew killed.",
      "A sniper’s aim: {hull} hull integrity lost, {crew} crew fall.",
      "They land a perfect shot. {hull} damage, {crew} casualties.",
      "A well‑aimed cannonball tears into your ship. {hull} hull, {crew} crew lost.",
    ],
    precision_miss: [
      "The enemy's precision shot misses.",
      "Their aimed shot splashes wide.",
      "A cannonball whistles past harmlessly.",
      "They fire too high – a miss.",
    ],
    grapple_success: [
      "The enemy grapples and boards! They kill {crew} of your crew.",
      "They latch on and swarm your deck, cutting down {crew} sailors.",
      "Enemy boarders pour over the rail. {crew} crew lost in the melee.",
      "They take your ship by force, killing {crew} of your men.",
    ],
    grapple_fail: [
      "The enemy's grapple fails. They lose {crew} crew in the attempt.",
      "You throw them back and they retreat, {crew} men lighter.",
      "The boarding is repelled. {crew} of theirs are cut down.",
      "They fail to board and pull back, losing {crew} crew.",
    ],
  },
};


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Enemy Ship Names
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ENEMY_SHIP_NAMES = {
  // Procedural Adjectives (With historical elements integrated)
  adjectives: [
    "Black", "Scarlet", "Iron", "Crimson", "Silent", 
    "Cursed", "Broken", "Savage", "Dread", "Wicked",
    "Royal", "Gilded", "Vengeful", "Phantom", "Raging", 
    "Shrouded", "Bleak", "Valiant", "Dauntless", "Defiant", 
    "Bloodied", "Rogue", "Haunted", "Grim", "Fearless","Resolute",
"Bold","Swift","Steadfast","Proud","Victorious","Relentless",
"Dark","Restless","Dire","Fierce","Weathered","Stormbound","Windward",
"Golden","Providence","Endeavour","Enterprise","Constant","Prosperous",
    // --- Historical Elements (Yields "Adventure Galley", "Happy Delivery", etc.) ---
    "Adventure", "Bachelor's", "Portsmouth", "Whydah", "Queen Anne's", "Happy"
  ],

  // Procedural Nouns (With historical elements integrated)
  nouns: [
    "Serpent", "Tide", "Fortune", "Drake", "Widow", 
    "Storm", "Revenge", "Horizon", "Ghost", "Fury",
    "Corsair", "Galleon", "Spectre", "Vanguard", "Marauder", 
    "Leviathan", "Rover", "Hellhound", "Voyager", "Monarch", 
    "Nightmare", "Kraken", "Banshee", "Gauntlet", "Wraith",
    "Shark","Whale","Albatross","Privateer","Sentinel","Guardian",
"Defender","Avenger","Providence","Endeavour","Resolution","Victory",
"Liberty","Concord","Prosperity","Success","Friendship","Treasure",
    // --- Historical Elements (Yields "Bachelor's Delight", "Royal Sovereign", etc.) ---
    "Galley", "Delight", "Sovereign", "Delivery", "Adventure"
  ]
};

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Encounter Flavour Text
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   const ENCOUNTER_FLAVOUR = {
    patrol: (enemy, rep) => rep < 20
      ? `A ${enemy.name} opens fire without warning.`
      : `A ${enemy.name} hails you and demands you heave to for inspection.`,

    navy_patrol: (enemy, rep) =>
     `A patrol from the ${enemy.faction} faction demands to inspect your cargo.`,

    hostile_port_entry: (enemy) =>
      `The harbour battery opens fire. You sailed into hostile waters.`,

    smuggling_caught: () =>
      `"Heave to for inspection!" The patrol has spotted your cargo hold.`,

    cargo_inspection_refused: () =>
      `The patrol vessel moves to enforce compliance. You have seconds to decide.`,

    distressed_merchant_help: (enemy, rep) =>
    `Pirates are attacking a merchant! You move to defend them.`,

    distressed_merchant_plunder: (enemy, rep) =>
      `The merchant's crew looks at you with desperate hope. You raise the black flag instead.`,

    bounty_target: (enemy) =>
      `You've cornered ${enemy.name}. There is nowhere left to run.`,

    named_rival: (enemy) =>
      `${enemy.name}'s ship emerges from the fog. This was no accident.`,

    mission_combat: (enemy) =>
      `Your target is in sight: ${enemy.name}. The mission requires engagement.`,

    escort_defend: (enemy, rep) =>
      `Pirates are raiding the convoy! Protect the merchant ship at all costs.`,

    random: (enemy) =>
      `${enemy.name} moves to intercept. They haven't fired yet.`,
  };

  const QM_DIALOGUE = {
  step0_welcome: (qmName, portName) =>
    `Welcome to ${portName}, Captain. I'm ${qmName}, your quartermaster. Let's see what work there is. Check the Contracts Board.`,

  step1_accepted: (qmName) =>
    `Right. We'll need to pick up the cargo and stock provisions. Let's head to the Market.`,

  step1_contractAccepted: (qmName) =>
  `Right. We'll need to pick up the cargo and stock provisions. Let's head to the Market.`,

  step2_marketOpen: (qmName) =>
    `Buy what we need for our contract, and don't forget provisions! Crew's gotta eat.`,

  step2_stocked: (qmName) =>
    `Cargo loaded, bellies will be full. Time to chart a course, Captain. Let's look at the Navigation map.`,

  step3_mapOpen: (qmName, destName) =>
    `Your destination port is just a few days' sail. Select it and we'll weigh anchor. You can zoom in to ease your weary sea eyes.`,

  step4_sailing: (qmName) =>
    `We're underway, Captain. Each day we sail brings us closer to our destination. Use the Advance Day button to make way. When we arrive, we can Enter Port.`,

   step5_arrival: (qmName) =>
    `We've made port. Head to the Mission board to deliver our cargo and collect the pay.`,

  step5_delivered: (qmName) =>
    `Well done, Captain. Coin in our pockets. Might be worth checking the Crew quarters.. we could use more hands.`,

  step6_crewOpen: (qmName) =>
    `Here's our lot. Hire a sailor: more crew means we can handle tougher work.`,

  step6_hired: (qmName) =>
    `Good, we've got hands now. There's a bounty posted. Hunt the Rat. Check the board.`,

  step6b_huntAccepted: (qmName) =>
    `Easy pickings. Let's set sail and find this rat!`,

  step6b_victory: (qmName) =>
    `Well fought! She's got some holes in her now. Let's find a Shipyard.`,

  step7_shipyardOpen: (qmName) =>
    `Repairs, upgrades, or a new ship when we've saved enough. Patch her up.`,

  step7_repaired: (qmName) =>
    `Good as new. I've been keeping a record, your Journal. It might be worth a look.`,

  step8_journalOpen: (qmName) =>
    `Everything's written down for you to consult at your pleasure. Your adventure saves itself each time we make port.`,

  step9_departure: (qmName) =>
    `${qmName} tips his hat. "You've got your sea legs now, Captain, you don't need me around. Fair winds." He takes a jolly boat ashore.`,
};

  // ── Merge into window.D ──────────────────────────────────
  Object.assign(window.D, {
    CREW_FIRST_NAMES,
    CREW_LAST_NAMES,
    CREW_ROLES,
    BIO_OPENINGS,
    PORT_GOSSIP_TEMPLATES,
    MARKET_FLAVOUR,
    MISSION_NAME_PARTS,
    COMBAT_LOG_TEMPLATES,
    ENEMY_SHIP_NAMES,
    ENCOUNTER_FLAVOUR,
    QM_DIALOGUE,
  });
})();