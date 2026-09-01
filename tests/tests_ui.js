// tests_ui.js
// ─────────────────────────────────────────────────────────────────────────────
// Two categories of tests:
//
// U.NS  — Namespace existence. Verifies every expected export is present on
//          window.D / window.L / window.G / window.E / window.UI / window.S.
//          These catch load-order regressions and renamed/removed exports
//          before any deeper test runs.
//
// U.SMOKE — Screen smoke renders. ONE test per major screen to verify
//            the component tree constructs without crashing.
//            Visual quality is human-tested.
//
// U.INTERACT — UI interaction tests (click, dispatch). These verify
//              user-visible behavior and are more valuable than render-only tests.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

const {
    makeState, makePortState, makeSailingState, makeBattleState,
    makeCrewMember, fillRoster, makeShip, makeHold, makeMission,
    makeEnemy,
} = window.testHelpers;
const A = window.E.A;
const D = window.D;
const SHIPS = D.SHIPS;
const L = window.L;

  const noop = () => {};
  const reg  = (id, name, run) => window._tests.push({ id, name, run });

  // ── React render helper ────────────────────────────────────────────────────
  // Mounts a component into a temporary div, then immediately unmounts.
  // Returns true if no exception is thrown, false (with error) otherwise.
  // Uses a detached div to keep tests from polluting the visible page.

  const renderSafe = (Component, props) => {
    const div = document.createElement("div");
    try {
      ReactDOM.render(React.createElement(Component, props), div);
      ReactDOM.unmountComponentAtNode(div);
      return { ok: true };
    } catch (e) {
      ReactDOM.unmountComponentAtNode(div);
      return { ok: false, error: e.message };
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // U.NS — Namespace existence
  // ══════════════════════════════════════════════════════════════════════════

  // ── window.D ──────────────────────────────────────────────────────────────

  reg("U.NS.01", "window.D: core data constants exist", (u) => {
    u.assert(window.D !== undefined, "window.D defined");
    const keys = ["PORTS", "SHIPS", "FACTIONS", "EQUIPMENT", "RESOURCES",
                  "STARTS", "RANDOM_EVENTS", "SHIP_VISUALS", "DEFAULT_CAREER",
                  "TUTORIAL_DELIVERY", "TUTORIAL_HUNT", "SURRENDER_CONSEQUENCE",
                  "GOODS_AVAILABILITY"];
    for (const k of keys) {
      u.assert(k in window.D, `D.${k} missing`);
    }
  });

  reg("U.NS.02", "window.D: text constants exist", (u) => {
    const keys = ["CREW_FIRST_NAMES", "CREW_LAST_NAMES", "QM_DIALOGUE",
                  "ARRIVAL_MESSAGES", "SAILING_MESSAGES", "VICTORY_MESSAGES",
                  "DEFEAT_MESSAGES", "FLED_MESSAGES", "REPAIR_MESSAGES",
                  "PURCHASE_MESSAGES", "BOARDING_SUCCESS_MESSAGES", "PLUNDER_MESSAGES",
                  "PORT_GOSSIP_TEMPLATES", "MARKET_FLAVOUR"];
    for (const k of keys) {
      u.assert(k in window.D, `D.${k} missing`);
    }
  });

  reg("U.NS.03", "window.D: FACTIONS has five entries", (u) => {
    const factions = Object.keys(window.D.FACTIONS);
    u.assert(factions.includes("english"),  "english faction");
    u.assert(factions.includes("spanish"),  "spanish faction");
    u.assert(factions.includes("french"),   "french faction");
    u.assert(factions.includes("dutch"),    "dutch faction");
    u.assert(factions.includes("pirate"),   "pirate faction");
  });

  reg("U.NS.04", "window.D: SHIPS has expected tier entries", (u) => {
    const ships = Object.keys(window.D.SHIPS);
    for (const t of ["dinghy", "cutter", "sloop", "schooner", "merchantman",
                      "brigantine", "corvette", "frigate", "fluyt", "galleon"]) {
      u.assert(ships.includes(t), `SHIPS.${t} missing`);
    }
  });

  reg("U.NS.05", "window.D: STARTS has faction-keyed shape (not array)", (u) => {
    const s = window.D.STARTS;
    u.assert(!Array.isArray(s), "STARTS is not an array");
    u.assert("factionPorts"    in s, "factionPorts");
    u.assert("factionRepAdjust" in s, "factionRepAdjust");
    u.assert("factionBackstory" in s, "factionBackstory");
    u.assert("factionQM"        in s, "factionQM");
    u.assert("gold"             in s, "shared gold");
    u.assert("ship"             in s, "shared ship");
    u.assert("hold"             in s, "shared hold");
    u.assertEqual(typeof s.factionPorts.english, "string", "english port is a string");
  });

  // ── window.L ──────────────────────────────────────────────────────────────

  reg("U.NS.06", "window.L: core logic functions exist", (u) => {
    const fns = [
      "getShipStats", "canInstallEquipment", "getEquipmentEffect",
      "travelDays", "canReach", "getUnreachableReason",
      "getSeaPosition", "travelDaysFromPosition", "canReachFromPosition", "getReachablePortsFromSea",
      "reputationLabel", "getFameInfo", "getRepPerk", "getInfamyLabel",
      "hasTag", "addTag", "removeTag", "revealTag",
      "getAlignmentModifier", "getCrewAlignment",
      "getHoldCapacity", "getHoldUsed",
      "getProvisionConsumptionForDay",
      "getDaysOfProvisions",
      "shipRepairCost",
      "classifyLogLine", "getLogTabCategory",
      "buildEncounterContext",
      "resolveNavalRound",
      "getNPCNavalAction",
      "getNPCBoardingAction",
      "resolveBoardingRound",
      "getBoardingRatio",
      "resolveSpeedContest",
      "stepDistance",
      "initialDistanceFor",
      "isFeatureUnlocked",
      "applyReputationImpact",
      "encodeSave", "decodeSave", "simpleHash",
      "logPick", "returnScreen",
    ];
    for (const fn of fns) {
      u.assert(typeof window.L[fn] === "function", `L.${fn} missing or not a function`);
    }
  });

  // ── window.G ──────────────────────────────────────────────────────────────

  reg("U.NS.07", "window.G: generator functions exist", (u) => {
    const fns = [
      "generatePortMarket", "generateMissions", "generateEnemy", "generateEnemyCargo",
      "generateCrewMember", "generateRoster", "generateCrewBio",
      "generatePortGossip", "generateMarketFlavour",
    ];
    for (const fn of fns) {
      u.assert(typeof window.G[fn] === "function", `G.${fn} missing`);
    }
  });

  // ── window.E ──────────────────────────────────────────────────────────────

  reg("U.NS.08", "window.E: engine infrastructure exists", (u) => {
    u.assert(typeof window.E.reducer === "function",       "E.reducer");
    u.assert(typeof window.E.autoSave === "function",      "E.autoSave");
    u.assert(typeof window.E.migrateState === "function",  "E.migrateState");
    u.assert(typeof window.E.logEntry === "function",      "E.logEntry");
    u.assert(typeof window.E.initialState === "object",   "E.initialState");
    u.assert(Array.isArray(window.E._reducers),            "E._reducers array");
    u.assert(window.E._reducers.length >= 6,               "at least 6 reducers registered");
  });

  reg("U.NS.09", "window.E.A: all action constants exist", (u) => {
    const actions = [
      "START_GAME", "NAVIGATE", "SAIL_TO", "ENTER_PORT", "ADVANCE_DAY",
      "REPAIR", "BUY_SHIP", "BUY_EQUIPMENT", "INSTALL_EQUIPMENT", "REMOVE_EQUIPMENT",
      "HIRE_CREW", "DISMISS_CREW", "RAISE_MORALE",
      "REFRESH_MISSIONS", "TAKE_MISSION", "COMPLETE_MISSION", "ABANDON_MISSION",
      "CONFIRM_TRADE",
      "INTERCEPT_FIGHT", "INTERCEPT_FLEE", "INTERCEPT_PARLEY",
      "INTERCEPT_BRIBE", "INTERCEPT_SURRENDER", "PATROL_INSPECT",
      "BATTLE_ACTION", "DISMISS_BATTLE", "TAKE_PLUNDER",
      "RESOLVE_EVENT", "ATTACK_PIRATE", "ATTACK_MERCHANT",
      "RESOLVE_DRIFTING_WRECK_SEARCH",
      "SAVE_GAME", "LOAD_GAME", "EXPORT_SAVE", "IMPORT_SAVE",
      "TOGGLE_AUTO_SAVE",
      "ONBOARDING_QM_SEEN", "ONBOARDING_SKIP", "ONBOARDING_COMPLETE",
      "DISCOVER_PORT",
      "TOP_UP_PROVISIONS",
    ];
    for (const a of actions) {
      u.assert(a in window.E.A, `E.A.${a} missing`);
    }
  });

  // ── window.ShipSprite ─────────────────────────────────────────────────────

  reg("U.NS.10", "window.ShipSprite: render function exists", (u) => {
    u.assert(typeof window.ShipSprite === "object", "ShipSprite object");
    u.assert(typeof window.ShipSprite.render === "function", "ShipSprite.render function");
  });

  reg("U.NS.11", "window.ShipSprite.render: returns an SVGElement for each ship type", (u) => {
    for (const type of ["dinghy", "cutter", "sloop", "frigate"]) {
      const el = window.ShipSprite.render(type, { faction: "english" });
      u.assert(el instanceof SVGElement, `render(${type}) returns SVGElement`);
    }
  });

  // ── window.UI ─────────────────────────────────────────────────────────────

  reg("U.NS.12", "window.UI: theme token T exists with key fields", (u) => {
    u.assert(typeof window.UI.T === "object", "T object");
    const tk = ["bg", "bgDeep", "bgAlt", "text", "textDim", "border", "gold", "font"];
    for (const k of tk) {
      u.assert(k in window.UI.T, `T.${k} missing`);
    }
  });

  reg("U.NS.13", "window.UI: core components exported", (u) => {
    const comps = [
      "Btn", "PulseBtn", "Bar", "Pill", "FactionPill", "RepPill",
      "StatBlock", "SectionTitle", "NarrativePanel", "NarrativeLine",
      "LogList", "Divider", "EmptyState",
      "BackButton", "Tooltip", "TransferLayout",
      "ShipSprite", "ShipSideSprite", "PortSilhouette",
      "panelStyle", "getGoodIcon", "useFlashOnChange", "TutorialPopup",
    ];
    for (const c of comps) {
      u.assert(c in window.UI, `UI.${c} missing`);
    }
  });

  reg("U.NS.14", "window.UI.LOG_ICONS: all category keys present", (u) => {
    u.assert(typeof window.UI.LOG_ICONS === "object", "LOG_ICONS is object");
    const cats = ["arrival", "sailing", "crew", "combat", "trade",
                  "mission", "discovery", "infamy", "warning"];
    for (const c of cats) {
      u.assert(c in window.UI.LOG_ICONS, `LOG_ICONS.${c} missing`);
      u.assert(typeof window.UI.LOG_ICONS[c] === "function",
        `LOG_ICONS.${c} should be a React component function`);
    }
  });

  // ── window.UI icons ───────────────────────────────────────────────────────

  reg("U.NS.15", "window.UI: resource icons exported", (u) => {
    const icons = [
      "IconFood", "IconWater", "IconRhum", "IconSugar", "IconSpice",
      "IconCloth", "IconTimber", "IconCoffee", "IconTobacco", "IconSilk",
      "IconCocoa", "IconGoldBag",
    ];
    for (const ic of icons) {
      u.assert(ic in window.UI, `${ic} missing`);
      u.assert(typeof window.UI[ic] === "function", `${ic} should be a function`);
    }
  });

  reg("U.NS.16", "window.UI: combat/action icons exported", (u) => {
    const icons = [
      "IconSwords", "IconCannon", "IconGrapple", "IconSpear",
      "IconShield", "IconSkull", "IconStar",
    ];
    for (const ic of icons) {
      u.assert(ic in window.UI, `${ic} missing`);
    }
  });

  // ── window.S ──────────────────────────────────────────────────────────────

  reg("U.NS.17", "window.S: all screen components exported", (u) => {
    const screens = [
      "TitleScreen", "NewGameScreen", "OnboardingPopup",
      "PortScreen", "StatusScreen", "JournalScreen",
      "MarketScreen", "ShipyardScreen", "CrewScreen",
      "MapScreen", "SailingScreen",
      "EventScreen", "InterceptScreen", "BattleScreen", "PlunderScreen",
      "MenuModal",
    ];
    for (const s of screens) {
      u.assert(s in window.S, `S.${s} missing`);
      u.assert(typeof window.S[s] === "function", `S.${s} is not a function`);
    }
  });

  reg("U.NS.18", "ui.jsx and screens_*.jsx do not call window.G", (u) => {
    const sourceFiles = [
      "ui.jsx",
      "screens_core.jsx", "screens_port.jsx", "screens_status.jsx",
      "screens_shipyard.jsx", "screens_crew.jsx", "screens_market.jsx",
      "screens_voyage.jsx", "screens_combat.jsx", "screens_menu.jsx"
    ];
    for (const file of sourceFiles) {
      const source = document.querySelector(`script[src*="${file}"]`)?.textContent || "";
      u.assert(!source.includes("G.generate"), `${file} contains direct G.generate call`);
    }
  });

  reg("U.NS.19", "PORT_SPECIALTIES labels are strings", (u) => {
    const ps = window.D.PORT_SPECIALTIES;
    for (const [faction, spec] of Object.entries(ps)) {
      u.assert(typeof spec.label === "string" && spec.label.length > 0, `label missing for ${faction}`);
      u.assert(typeof spec.id === "string" && spec.id.length > 0, `id missing for ${faction}`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // U.SMOKE — One render test per major screen (no visual verification)
  // ══════════════════════════════════════════════════════════════════════════

  reg("U.SMOKE.01", "TitleScreen: renders without throwing", (u) => {
    const r = renderSafe(window.S.TitleScreen, { dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.02", "NewGameScreen: renders without throwing", (u) => {
    const r = renderSafe(window.S.NewGameScreen, { dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.03", "PortScreen: renders without throwing — basic port state", (u) => {
    const state = makePortState("portRoyal", {
      portGossip: ["Test gossip line."],
      portMarket: null,
      missions: [],
    });
    const r = renderSafe(window.S.PortScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.04", "StatusScreen: renders without throwing", (u) => {
    const state = makePortState("portRoyal", {
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const r = renderSafe(window.S.StatusScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.05", "JournalScreen: renders without throwing — populated log", (u) => {
    const state = makePortState("portRoyal", {
      log: [
        "[1] Arrived at Port Royal.",
        "[2] Bought 10 sugar.",
        "[3] Lost crew: Jean Dupont.",
        "[4] Victory! Enemy sunk.",
      ],
    });
    const r = renderSafe(window.S.JournalScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.06", "MarketScreen: renders without throwing — populated market", (u) => {
    const state = makePortState("portRoyal", {
      portMarket: {
        goods: {
          sugar: { buyFromPort: 50, sellToPort: 40, available: 20, price: 50 },
          cloth: { buyFromPort: 60, sellToPort: 45, available: 10, price: 60 },
        },
      },
      hold: makeHold({ sugar: 5 }),
    });
    const r = renderSafe(window.S.MarketScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.07", "ShipyardScreen: renders without throwing", (u) => {
    const state = makePortState("portRoyal", { fame: 0 });
    const r = renderSafe(window.S.ShipyardScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.08", "CrewScreen: renders without throwing — empty roster", (u) => {
    const state = makePortState("portRoyal", {
      crew: { roster: [], max: 5, morale: 80 },
    });
    const r = renderSafe(window.S.CrewScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.09", "MapScreen: renders without throwing — at port", (u) => {
    const state = makePortState("portRoyal", {
      discoveredPorts: Object.keys(window.D.PORTS).filter(k => !window.D.PORTS[k].hidden),
    });
    const r = renderSafe(window.S.MapScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.10", "SailingScreen: renders without throwing", (u) => {
    const state = makeSailingState("portRoyal", "tortuga", 3, {
      hold: makeHold({ food: 20, water: 20 }),
    });
    const r = renderSafe(window.S.SailingScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.11", "EventScreen: renders without throwing — with event", (u) => {
    const state = makePortState("portRoyal", {
      activeEvent: {
        id: "test_event",
        title: "Strange Sighting",
        description: "A light on the horizon.",
        choices: [
          { id: "investigate", label: "Investigate", outcome: { gold: 50 } },
          { id: "ignore",      label: "Ignore",      outcome: {} },
        ],
      },
    });
    const r = renderSafe(window.S.EventScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.12", "InterceptScreen: renders without throwing — with encounter", (u) => {
    const enemy = {
      name: "The Test Brigand",
      faction: "pirate",
      shipType: "sloop",
      hull: 100, maxHull: 100,
      cannons: 10, crew: 20, speed: 8,
    };
    const state = makePortState("portRoyal", {
      encounterSession: {
        type: "random",
        phase: "intercept",
        enemy,
        intercept: {
          flavourText: "A pirate ship emerges from the fog.",
          options: [
            { id: "fight",     label: "Fight",     available: true,  reason: null, action: { type: "INTERCEPT_FIGHT" } },
            { id: "flee",      label: "Flee",      available: true,  reason: null, action: { type: "INTERCEPT_FLEE" } },
            { id: "surrender", label: "Surrender", available: true,  reason: null, action: { type: "INTERCEPT_SURRENDER" } },
          ],
        },
        battle: null,
        plunder: null,
        returnScreen: "port",
        source: { kind: "random", id: null },
        modifiers: [],
        notableNPCId: null,
      },
    });
    const r = renderSafe(window.S.InterceptScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.13", "BattleScreen: renders without throwing", (u) => {
    const s0 = makePortState("portRoyal", {
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });
    const enemy = {
      name: "The Scarlet Fortune",
      faction: "spanish",
      hull: 120,
      maxHull: 120,
      cannons: 20,
      crew: 18,
      speed: 9,
      risk: "medium",
    };
    const battle = {
      round: 1,
      log: ["Battle engaged!"],
      playerHull: s0.ship.hull,
      playerCrew: s0.crew.roster.length,
      initialPlayerCrew: s0.crew.roster.length,
      lostCrewNames: [],
      enemyHull: enemy.hull,
      enemyCrew: enemy.crew,
      distance: "medium",
      subPhase: "naval",
    };
    const session = {
      type: "random",
      phase: "battle",
      enemy: enemy,
      battle: battle,
      intercept: null,
      plunder: null,
      returnScreen: "port",
      source: { kind: "random", id: null },
      modifiers: [],
      notableNPCId: null,
    };
    const state = { ...s0, screen: "battle", encounterSession: session };
    const r = renderSafe(window.S.BattleScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  reg("U.SMOKE.14", "PlunderScreen: renders without throwing", (u) => {
    const s0 = makePortState("portRoyal", {
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });
    const enemy = {
      name: "The Prize",
      faction: "spanish",
      hull: 0,
      maxHull: 180,
      cannons: 5,
      crew: 8,
      speed: 8,
      risk: "low",
    };
    const battle = {
      round: 1,
      log: ["You boarded!"],
      playerHull: s0.ship.hull,
      playerCrew: s0.crew.roster.length,
      initialPlayerCrew: s0.crew.roster.length,
      lostCrewNames: [],
      enemyHull: enemy.hull,
      enemyCrew: enemy.crew,
      distance: "close",
      subPhase: "boarding",
      phase: "victory",
      canPlunder: true,
      goldReward: 200,
      enemyCargo: { sugar: 10, cloth: 5 },
    };
    const session = {
      type: "random",
      phase: "plunder",
      enemy: enemy,
      battle: battle,
      intercept: null,
      plunder: null,
      returnScreen: "port",
      source: { kind: "random", id: null },
      modifiers: [],
      notableNPCId: null,
    };
    const state = { ...s0, screen: "plunder", encounterSession: session };
    const r = renderSafe(window.S.PlunderScreen, { state, dispatch: noop });
    u.assert(r.ok, r.error || "render threw");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // U.ICON — Icon component renders (cheap, catch regressions)
  // ══════════════════════════════════════════════════════════════════════════

  reg("U.ICON.01", "LOG_ICONS: all icon components render without throwing", (u) => {
    for (const [cat, IconComp] of Object.entries(window.UI.LOG_ICONS)) {
      const div = document.createElement("div");
      try {
        ReactDOM.render(React.createElement(IconComp, { size: 12 }), div);
        ReactDOM.unmountComponentAtNode(div);
      } catch (e) {
        u.assert(false, `LOG_ICONS.${cat} threw: ${e.message}`);
        return;
      }
    }
    u.assert(true, "all LOG_ICONS render without throwing");
  });

  reg("U.ICON.02", "Resource icons render without throwing", (u) => {
    const icons = [
      "IconFood", "IconWater", "IconRhum", "IconSugar", "IconSpice",
      "IconGold", "IconGoldBag", "IconSwords", "IconCannon", "IconAnchor",
      "IconShield", "IconSkull", "IconStar", "IconCrew", "IconMap",
    ];
    for (const name of icons) {
      const IconComp = window.UI[name];
      if (!IconComp) continue;
      const div = document.createElement("div");
      try {
        ReactDOM.render(React.createElement(IconComp, { size: 16 }), div);
        ReactDOM.unmountComponentAtNode(div);
      } catch (e) {
        u.assert(false, `${name} threw: ${e.message}`);
        return;
      }
    }
    u.assert(true, "all icon components render without throwing");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // U.INTERACT — UI interaction tests (render, click, verify dispatch)
  // ══════════════════════════════════════════════════════════════════════════

  // Helper to render a component and return the container plus a mock dispatch
  const renderComponent = (Component, props) => {
    const container = document.createElement("div");
    const dispatch = () => {};
    const dispatchMock = (action) => { dispatchMock.calls.push(action); };
    dispatchMock.calls = [];
    try {
      ReactDOM.render(React.createElement(Component, { ...props, dispatch: dispatchMock }), container);
    } catch (e) {
      ReactDOM.unmountComponentAtNode(container);
      throw e;
    }
    return { container, dispatchMock };
  };

  // Helper to find a button by its text content
  const findButtonByText = (container, text) => {
    const buttons = container.querySelectorAll("button");
    for (const btn of buttons) {
      if (btn.textContent.includes(text)) return btn;
    }
    return null;
  };

  // Helper to find a div with specific text
  const findElementByText = (container, text) => {
    const elements = container.querySelectorAll("div, span, p");
    for (const el of elements) {
      if (el.textContent.includes(text)) return el;
    }
    return null;
  };

  // ── U.INTERACT.PORTMODAL ─────────────────────────────────────────

  reg("U.INTERACT.PORTMODAL.01", "PortModal: Set Sail enabled for reachable port and dispatches SAIL_TO", (u) => {
    const state = makePortState("portRoyal", {
      currentPort: "portRoyal",
      destination: null,
      sailingDaysLeft: 0,
      discoveredPorts: Object.keys(D.PORTS),
      reputation: { ...window.E.initialState.reputation, portRoyal: 50, tortuga: 50 },
      activeMission: null,
      ship: makeShip("sloop"),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold(),
      portMarket: { goods: { sugar: { buyFromPort: 50, sellToPort: 40, available: 20 } } },
    });

    const { container, dispatchMock } = renderComponent(window.UI.PortModal, {
      targetPortKey: "tortuga",
      state,
      onClose: () => {},
    });

    const sailBtn = findButtonByText(container, "Set Sail");
    u.assert(sailBtn !== null, "Set Sail button exists");
    u.assert(!sailBtn.disabled, "Set Sail button is enabled for reachable port");

    sailBtn.click();
    u.assert(dispatchMock.calls.some(c => c.type === A.SAIL_TO && c.port === "tortuga"),
      "SAIL_TO dispatched with correct port");
  });

  reg("U.INTERACT.PORTMODAL.02", "PortModal: Set Sail disabled for unreachable port and no dispatch", (u) => {
    const state = makePortState("portRoyal", {
      currentPort: "portRoyal",
      destination: null,
      sailingDaysLeft: 0,
      discoveredPorts: Object.keys(D.PORTS),
      reputation: { ...window.E.initialState.reputation, portRoyal: 50, bermuda: 50 },
      activeMission: null,
      ship: makeShip("dinghy"),
      crew: { roster: [], max: 5, morale: 80 },
      hold: makeHold(),
    });

    const { container, dispatchMock } = renderComponent(window.UI.PortModal, {
      targetPortKey: "bermuda",
      state,
      onClose: () => {},
    });

    const cannotSailBtn = findButtonByText(container, "Cannot Sail");
    u.assert(cannotSailBtn !== null, "Cannot Sail button exists");
    u.assert(cannotSailBtn.disabled === true, "Cannot Sail button is disabled");
    cannotSailBtn.click();
    u.assert(dispatchMock.calls.length === 0, "No dispatch when disabled");
  });

  reg("U.INTERACT.PORTMODAL.03", "PortModal: mission target indicator shown", (u) => {
    const mission = makeMission({ targetPort: "tortuga" });
    const state = makePortState("portRoyal", {
      activeMission: mission,
      currentPort: "portRoyal",
      destination: null,
      sailingDaysLeft: 0,
      discoveredPorts: Object.keys(D.PORTS),
      reputation: { ...window.E.initialState.reputation, portRoyal: 50, tortuga: 50 },
      ship: makeShip("sloop"),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold(),
    });

    const { container } = renderComponent(window.UI.PortModal, {
      targetPortKey: "tortuga",
      state,
      onClose: () => {},
    });

    const missionIndicator = findElementByText(container, "Mission target");
    u.assert(missionIndicator !== null, "Mission target indicator present");
  });

  reg("U.INTERACT.PORTMODAL.04", "PortModal: trade tip shown when previewPortMarket set", (u) => {
    const state = makePortState("portRoyal", {
      currentPort: "portRoyal",
      destination: null,
      sailingDaysLeft: 0,
      discoveredPorts: Object.keys(D.PORTS),
      reputation: { ...window.E.initialState.reputation, portRoyal: 50, tortuga: 50 },
      activeMission: null,
      ship: makeShip("sloop"),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold(),
      portMarket: { goods: { sugar: { buyFromPort: 50, sellToPort: 40, available: 20 } } },
      previewPortMarket: { goods: { sugar: { sellToPort: 80 } } },
    });

    const { container } = renderComponent(window.UI.PortModal, {
      targetPortKey: "tortuga",
      state,
      onClose: () => {},
    });

    const tradeTip = findElementByText(container, "Trade Tip");
    u.assert(tradeTip !== null, "Trade tip present");
  });

  // ── U.INTERACT.INTERCEPT ────────────────────────────────────────

  reg("U.INTERACT.INTERCEPT.01", "InterceptScreen: renders all options with correct availability", (u) => {
    const enemy = makeEnemy({ name: "Test", faction: "pirate" });
    const ctx = {
      type: "random",
      phase: "intercept",
      enemy,
      intercept: {
        flavourText: "Test",
        options: [
          { id: "fight", label: "Fight", available: true, reason: null, action: { type: "INTERCEPT_FIGHT" } },
          { id: "flee", label: "Flee", available: true, reason: null, action: { type: "INTERCEPT_FLEE" } },
          { id: "parley", label: "Parley", available: true, reason: null, action: { type: "INTERCEPT_PARLEY" } },
          { id: "bribe", label: "Bribe", available: true, reason: null, action: { type: "INTERCEPT_BRIBE" } },
          { id: "surrender", label: "Surrender", available: true, reason: null, action: { type: "INTERCEPT_SURRENDER" } },
        ],
      },
      returnScreen: "port",
    };
    const state = makePortState("portRoyal", {
      encounterSession: { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null },
    });

    const { container, dispatchMock } = renderComponent(window.S.InterceptScreen, { state });

    for (const opt of ctx.intercept.options) {
      const btn = findButtonByText(container, opt.label);
      u.assert(btn !== null, `Option "${opt.label}" rendered`);
    }

    const fightBtn = findButtonByText(container, "Fight");
    fightBtn.click();
    u.assert(dispatchMock.calls.some(c => c.type === A.INTERCEPT_FIGHT), "FIGHT dispatched");
  });

  reg("U.INTERACT.INTERCEPT.02", "InterceptScreen: unavailable option shows reason and does not dispatch", (u) => {
    const enemy = makeEnemy({ name: "Test", faction: "pirate" });
    const ctx = {
      type: "navy_patrol",
      phase: "intercept",
      enemy,
      intercept: {
        flavourText: "Test",
        options: [
          { id: "fight", label: "Fight", available: true, reason: null, action: { type: "INTERCEPT_FIGHT" } },
          { id: "inspect", label: "Inspect", available: true, reason: null, action: { type: "PATROL_INSPECT" } },
          { id: "bribe", label: "Bribe", available: false, reason: "No contraband", action: null },
        ],
      },
      returnScreen: "port",
    };
    const state = makePortState("portRoyal", {
      encounterSession: { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null },
    });

    const { container, dispatchMock } = renderComponent(window.S.InterceptScreen, { state });

    const bribeBtn = findButtonByText(container, "Bribe");
    u.assert(bribeBtn !== null, "Bribe button rendered");
    u.assert(bribeBtn.disabled, "Bribe button disabled");
    const reason = findElementByText(container, "No contraband");
    u.assert(reason !== null, "Reason text shown");
    bribeBtn.click();
    u.assert(dispatchMock.calls.length === 0, "No dispatch for disabled option");
  });

  // ── U.INTERACT.BATTLE ───────────────────────────────────────────

  // ── U.INTERACT.BATTLE.01 (naval actions) ──────────────────────────
reg("U.INTERACT.BATTLE.01", "BattleScreen: naval actions rendered and clickable", (u) => {
  const s0 = makeBattleState({
    subPhase: "naval",
    distance: "medium",
    phase: "player_turn",
  });
  const state = { ...s0, screen: "battle" };

  const { container, dispatchMock } = renderComponent(window.S.BattleScreen, { state });

  // Find action elements by text
  const broadsideEl = findElementByText(container, "Broadside");
  const closeEl = findElementByText(container, "Close Distance");
  const evadeEl = findElementByText(container, "Evade");

  u.assert(broadsideEl !== null, "Broadside element exists");
  u.assert(closeEl !== null, "Close Distance element exists");
  u.assert(evadeEl !== null, "Evade element exists");

  // At medium distance, Close Distance should be enabled (clickable)
  // We'll simulate click and check dispatch
  closeEl.click();
  u.assert(dispatchMock.calls.some(c => c.type === A.BATTLE_ACTION && c.action === "close_distance"),
    "Close Distance should be clickable and dispatch BATTLE_ACTION");

  // Evade should be disabled (not clickable) at medium distance
  // We'll try to click and assert no dispatch
  const initialCalls = dispatchMock.calls.length;
  evadeEl.click();
  u.assertEqual(dispatchMock.calls.length, initialCalls,
    "Evade should not dispatch at medium distance");
});

// ── U.INTERACT.BATTLE.02 (boarding actions) ────────────────────────
reg("U.INTERACT.BATTLE.02", "BattleScreen: boarding actions rendered and demand surrender enabled", (u) => {
  const s0 = makeBattleState({
    subPhase: "boarding",
    distance: "close",
    phase: "player_turn",
    playerCrew: 20,
    enemyCrew: 5,
  });
  const state = { ...s0, screen: "battle" };

  const { container, dispatchMock } = renderComponent(window.S.BattleScreen, { state });

  const continueEl = findElementByText(container, "Continue Fighting");
  const demandEl = findElementByText(container, "Demand Surrender");

  u.assert(continueEl !== null, "Continue Fighting element exists");
  u.assert(demandEl !== null, "Demand Surrender element exists");

  // With high advantage (20 vs 5), Demand Surrender should be enabled
  demandEl.click();
  u.assert(dispatchMock.calls.some(c => c.type === A.BATTLE_ACTION && c.action === "demand_surrender"),
    "Demand Surrender should be clickable with high advantage");
});

  reg("U.INTERACT.BATTLE.03", "BattleScreen: convoy HP shown when convoyHull exists", (u) => {
    const s0 = makeBattleState({
      subPhase: "naval",
      distance: "medium",
      phase: "player_turn",
      convoyHull: 30,
      convoyLost: false,
    });
    const state = { ...s0, screen: "battle" };

    const { container } = renderComponent(window.S.BattleScreen, { state });

    const convoyLabel = findElementByText(container, "Convoy Hull");
    u.assert(convoyLabel !== null, "Convoy Hull indicator present");
  });

  reg("U.INTERACT.BATTLE.04", "BattleScreen: demand_surrender disabled when ratio < 0.65", (u) => {
  const s0 = makeBattleState({
    subPhase: "boarding",
    distance: "close",
    phase: "player_turn",
    playerCrew: 5,
    enemyCrew: 20,
  });
  const state = { ...s0, screen: "battle" };

  const { container, dispatchMock } = renderComponent(window.S.BattleScreen, { state });

  const demandEl = findElementByText(container, "Demand Surrender");
  u.assert(demandEl !== null, "Demand Surrender element exists");

  // With low advantage (5 vs 20), Demand Surrender should be disabled
  const initialCalls = dispatchMock.calls.length;
  demandEl.click();
  u.assertEqual(dispatchMock.calls.length, initialCalls,
    "Demand Surrender should not dispatch when advantage < 0.65");
});

})();