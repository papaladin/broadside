// engine_scripted.js
// ─────────────────────────────────────────────────────────────────────────────
// Scripted gameplay recorder.
// When the URL contains ?scripted=1, this overrides START_GAME to produce
// a deterministic, visually interesting game loop that can be recorded for
// trailers / GIFs / screenshots.
//
// All changes are gated behind the URL param. Normal gameplay is untouched.
//
// Depends on: window.E (action constants, reducer chain)
// Exposes:    nothing — pushes one reducer into window.E._reducers
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  // Only activate when ?scripted=1 is in the URL
  if (!/[\?&]scripted=1/.test(window.location.search)) return;

  const A = window.E.A;

  // ── Scripted event queue ──────────────────────────────────────────────
  const SCRIPTED_EVENTS = [
    {
      id: "drifting_sailors",
      type: "choice",
      title: "Marooned Sailors",
      desc: "A small boat hails you. Three sunburnt sailors beg for passage.",
      choices: [
        {
          label: "Take them aboard",
          outcome: {
            addCrew: { count: 3, faction: null, tags: [], negativeTagChance: 0 },
            log: "You take the sailors aboard. They seem grateful... for now."
          }
        },
        { label: "Sail on", outcome: { moraleBonus: -1, log: "You leave them to their fate." } }
      ]
    },
    {
      id: "drunkard_scripted",
      type: "crew",
      title: "A Thief in the Night",
      desc: "The bosun reports that someone has been stealing from the rum stores.",
      choices: [
        {
          label: "Investigate",
          outcome: {
            log: "You find the ship's carpenter, Pieter van Dijk, with a half-empty bottle. He shrugs. 'Morale, Captain. Morale.'",
            moraleBonus: 0   // no mechanical effect, just the log
          }
        }
      ]
    }
  ];

  // ── Scripted reducer ──────────────────────────────────────────────────
  function scriptedReducer(state, action) {
    switch (action.type) {
      case A.START_GAME: {
        // Build our scripted initial state
        const start = window.D.STARTS;
        const startPort = "portRoyal";   // has crew + shipyard + missions
        const newState = JSON.parse(JSON.stringify(window.E.initialState));

        newState.screen = "port";
        newState.day = 1;
        newState.captainName = "William Hartley";
        newState.faction = "english";
        newState.tutorialMode = "light";   // no QM, clean UI
        newState.onboarding.enabled = false;
        newState.onboarding.completed = true;
        newState.gold = 2000;
        newState.fame = 11;
        newState.currentPort = startPort;
        newState.scriptedMode = true;
        newState.scriptedStep = 0;

        // Ship: sloop with decent hull for combat
        const shipData = window.D.SHIPS.sloop;
        newState.ship = {
          type: "sloop",
          name: "Cartographer's Folly",
          hull: shipData.maxHull,
          cannons: shipData.cannons,
          equipment: { hull: [], armament: [], rigging: [], special: [] },
        };

        // Hold: food, water, rum (for drunkard event)
        newState.hold = {
          capacity: shipData.holdCapacity,
          items: {
            food: 20, water: 20, rum: 5,
            sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
            coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
          },
        };

        // Crew: 10 members, including a drunkard
        newState.crew = {
          max: shipData.maxCrew,
          morale: 80,
          roster: [
            { id: "s1", firstName: "William", lastName: "Hartley", role: "captain", faction: "english", daysAboard: 47, tags: ["seasoned"], bio: "Captain and navigator." },
            { id: "s2", firstName: "Pieter", lastName: "van Dijk", role: "carpenter", faction: "dutch", daysAboard: 12, tags: ["hidden_drunkard"], bio: "Joined in Port Royal. Quiet, but always near the rum stores." },
            { id: "s3", firstName: "Maria", lastName: "Navarro", role: "gunner", faction: "spanish", daysAboard: 22, tags: [], bio: "A steady hand on the cannons." },
            { id: "s4", firstName: "Jean", lastName: "Petit", role: "cook", faction: "french", daysAboard: 8, tags: [], bio: "Makes a tolerable stew." },
            { id: "s5", firstName: "Scarred", lastName: "Jim", role: "deckhand", faction: "pirate", daysAboard: 35, tags: ["scar_battle"], bio: "No one remembers Jim's real name." },
            { id: "s6", firstName: "Anne", lastName: "Blythe", role: "deckhand", faction: "english", daysAboard: 4, tags: [], bio: "Signed on in Port Royal." },
            { id: "s7", firstName: "Carlos", lastName: "Ramos", role: "gunner", faction: "spanish", daysAboard: 15, tags: [], bio: "Fast with the cannons." },
            { id: "s8", firstName: "Luc", lastName: "Fournier", role: "deckhand", faction: "french", daysAboard: 6, tags: [], bio: "New face." },
            { id: "s9", firstName: "Dirk", lastName: "Visser", role: "carpenter", faction: "dutch", daysAboard: 9, tags: [], bio: "Quiet and efficient." },
            { id: "s10", firstName: "Calico", lastName: "Rackham", role: "navigator", faction: "pirate", daysAboard: 20, tags: [], bio: "Claims to know every reef." },
          ],
        };

        // Reputation: neutral with English, slightly hostile with Spanish
        const rep = {};
        Object.keys(window.D.PORTS).forEach(k => { rep[k] = 50; });
        rep.portRoyal = 65;
        rep.kingston = 60;
        rep.havana = 35;
        rep.santiagoDeCuba = 35;
        newState.reputation = rep;

        // Scripted mission: combat against a cutter near Martinique
        newState.missions = [{
          type: "combat",
          name: "Hunt the Scarlet Fortune",
          description: "A Spanish cutter has been raiding French merchant shipping near Martinique.",
          faction: "english",
          targetPort: "martinique",
          risk: "low",
          gold: 800,
          fame: 2,
          infamyGain: 0,
          repImpact: { english: 3 },
          enemy: {
            name: "The Scarlet Fortune",
            faction: "spanish",
            hull: 40, maxHull: 40,
            cannons: 4,
            crew: 8,
            speed: 8,
          },
          tutorial: false,
        }];
        newState.activeMission = {
          ...newState.missions[0],
          encounterOccurred: false,
          acceptedDay: 1,
        };

        // Market
        newState.portMarket = window.G.generatePortMarket(startPort, newState);
        newState.portGossip = window.G.generatePortGossip(newState, startPort);

        return newState;
      }

      case A.ADVANCE_DAY: {
        if (!state.scriptedMode) return state;

        const step = state.scriptedStep || 0;

        // After the first advance day, fire marooned sailors event
        if (step === 0 && state.sailingDaysLeft === state.sailingDaysTotal - 1) {
          return {
            ...state,
            activeEvent: SCRIPTED_EVENTS[0],
            screen: "event",
            scriptedStep: step + 1,
          };
        }

        // After the second advance day, fire drunkard event
        if (step === 1 && state.sailingDaysLeft === state.sailingDaysTotal - 2) {
          return {
            ...state,
            activeEvent: SCRIPTED_EVENTS[1],
            screen: "event",
            scriptedStep: step + 1,
          };
        }

        // After the third advance day, trigger the mission combat encounter
        if (step === 2 && state.sailingDaysLeft <= 3 && !state.activeMission?.encounterOccurred) {
          const ctx = window.L.buildEncounterContext(
            state,
            "mission_combat",
            state.activeMission.enemy
          );
          return {
            ...state,
            encounterContext: ctx,
            screen: "intercept",
            activeMission: { ...state.activeMission, encounterOccurred: true },
            scriptedStep: step + 1,
          };
        }

        return state;
      }

      default:
        return state;
    }
  }

  // ── Register reducer AFTER all domain reducers ──────────────────────
  window.E._reducers.push(scriptedReducer);
})();