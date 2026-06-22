// engine_onboarding.js
// ─────────────────────────────────────────────────────────────────────────────
// Onboarding middleware reducer.
//
// Owns:
//   - The middleware reducer that watches actions and marks
//     state.onboarding.stepsCompleted[X] = true based on STEP_RULES.
//   - The three lifecycle reducers: ONBOARDING_QM_SEEN, ONBOARDING_SKIP,
//     ONBOARDING_COMPLETE.
//
// Does NOT own:
//   - START_GAME bootstrap (lives in engine_port.js; initialization, not progression)
//   - Tutorial mission injection (lives in engine_port.js; content gating)
//   - Random event suppression during onboarding (lives in engine_voyage.js)
//   - Force-stocking tutorial goods (lives in generators.js)
//
// Load order:
//   This file MUST load AFTER engine_core.js, engine_port.js, engine_voyage.js,
//   and engine_combat.js. The middleware needs to see post-domain-reducer state
//   to inspect things like the post-trade hold contents and post-victory phase.
//
// Depends on: window.E (action constants, reducer chain)
// Exposes:   nothing new; pushes two reducers into window.E._reducers
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const A = window.E.A;

  // ─── Helpers ─────────────────────────────────────────────────────────────

  // Build a new onboarding object with the given step flags set to true,
  // and the given qmMessagesSeen keys marked seen.
  // Returns null when nothing changes (lets the middleware short-circuit).
  function applyMarks(onboarding, marks) {
    if (!marks) return null;
    const steps = marks.steps || [];
    const seen = marks.qmSeen || [];

    // Filter to only those that need changing
    const stepsToSet = steps.filter(
      (s) => onboarding.stepsCompleted && !onboarding.stepsCompleted[s]
    );
    const seenToSet = seen.filter(
      (k) => !onboarding.qmMessagesSeen || !onboarding.qmMessagesSeen[k]
    );
    if (stepsToSet.length === 0 && seenToSet.length === 0) return null;

    const next = {
      ...onboarding,
      stepsCompleted: { ...(onboarding.stepsCompleted || {}) },
      qmMessagesSeen: { ...(onboarding.qmMessagesSeen || {}) },
    };
    stepsToSet.forEach((s) => {
      next.stepsCompleted[s] = true;
    });
    seenToSet.forEach((k) => {
      next.qmMessagesSeen[k] = true;
    });
    return next;
  }

  // ─── STEP_RULES table ────────────────────────────────────────────────────
  // Each rule receives (prevState, nextState, action) and returns either:
  //   - null  (no change)
  //   - { steps: ['stepKey'], qmSeen: ['msgKey'] }
  // Either field is optional.
  //
  // `prevState` is the state BEFORE the domain reducer ran.
  // `nextState` is the state AFTER the domain reducer ran (and before this
  //             middleware applies its own change).

  const STEP_RULES = {
    // NAVIGATE: opening each screen marks it seen
    [A.NAVIGATE]: (prev, next, action) => {
      const screenMap = {
        market: "marketOpened",
        map: "mapOpened",
        crew: "crewOpened",
        shipyard: "shipyardOpened",
        journal: "journalOpened",
      };
      const step = screenMap[action.screen];
      return step ? { steps: [step] } : null;
    },

    // SAIL_TO: departing or re-routing both count as starting a voyage
    [A.SAIL_TO]: () => ({
      steps: ["mapOpened", "firstVoyageStarted"],
    }),

    // ENTER_PORT: every port arrival marks firstArrival; reaching the port
    // screen also implicitly means the contracts panel is reachable
    [A.ENTER_PORT]: () => ({
      steps: ["contractsOpened", "firstArrival"],
    }),

    // REPAIR: hitting the repair button at all counts as the step done
    [A.REPAIR]: () => ({
      steps: ["shipRepaired"],
    }),

    // HIRE_CREW: any successful hire counts
    [A.HIRE_CREW]: (prev, next) => {
      // Only count it if the roster actually grew (avoids "no gold" no-ops)
      const grew = (next.crew?.roster?.length || 0) > (prev.crew?.roster?.length || 0);
      return grew ? { steps: ["firstCrewHired"] } : null;
    },

    // TAKE_MISSION: accepting the tutorial hunt marks the step and silences
    // the QM popups that were prompting the player to do this
    [A.TAKE_MISSION]: (prev, next) => {
      const m = next.activeMission;
      if (!m || !m.tutorial) return null;
      // Tutorial hunt = tutorial mission without a requiredGood
      if (!m.requiredGood) {
        return {
          steps: ["tutorialHuntAccepted"],
          qmSeen: ["crewHired", "huntAccepted"],
        };
      }
      // Tutorial delivery = tutorial mission WITH a requiredGood, accepted at START_GAME
      return { steps: ["firstContractAccepted"] };
    },

    // COMPLETE_MISSION: at this point next.activeMission is already null,
    // so we look at the PREVIOUS state to know what was completed
    [A.COMPLETE_MISSION]: (prev) => {
      const m = prev.activeMission;
      if (!m || !m.tutorial) return null;
      // Tutorial delivery (had a requiredGood) -> firstContractDelivered
      if (m.requiredGood) return { steps: ["firstContractDelivered"] };
      // Tutorial hunt (no requiredGood) -> tutorialHuntCompleted
      return { steps: ["tutorialHuntCompleted"] };
    },

    // CONFIRM_TRADE: counts only when the tutorial delivery is active AND
    // the post-trade hold has both required goods and provisions
    [A.CONFIRM_TRADE]: (prev, next) => {
      const m = next.activeMission;
      if (!m || !m.tutorial || !m.requiredGood) return null;
      const items = next.hold?.items || {};
      const hasGoods = (items[m.requiredGood] || 0) >= (m.requiredQty || 1);
      const hasProvisions =
        (items.food || 0) > 0 && (items.water || 0) > 0;
      return hasGoods && hasProvisions
        ? { steps: ["provisionsAndGoodsBought"] }
        : null;
    },

    // DISMISS_BATTLE: tutorial hunt victory counts as completion
    // (mirrors COMPLETE_MISSION's hunt branch, since some flows finish the
    //  battle without an explicit COMPLETE_MISSION dispatch)
    [A.DISMISS_BATTLE]: (prev) => {
      const m = prev.activeMission;
      const battle = prev.battleState;
      if (!m || !m.tutorial || m.requiredGood) return null;
      if (!battle || battle.phase !== "victory") return null;
      return { steps: ["tutorialHuntCompleted"] };
    },

    // START_GAME: initial bootstrap from engine_port.js already sets
    // contractsOpened and firstContractAccepted when a tutorial mission is
    // injected. We mirror those here as a safety net so that the rules
    // describe the full picture in one place.
    [A.START_GAME]: (prev, next) => {
      if (!next.onboarding?.enabled) return null;
      if (!next.activeMission?.tutorial) return null;
      return { steps: ["contractsOpened", "firstContractAccepted"] };
    },
  };

  // ─── Middleware reducer ──────────────────────────────────────────────────
  // Runs after every domain reducer. Skips fast when onboarding is off.

  function onboardingMiddleware(state, action) {
    const ob = state.onboarding;
    if (!ob || !ob.enabled || ob.completed) return state;

    const rule = STEP_RULES[action.type];
    if (!rule) return state;

    // We need the pre-action state for rules like COMPLETE_MISSION.
    // engine_core.js stashes it on action.__prevState before the chain runs.
    // If absent, fall back to current state (rules that need prev will no-op).
    const prevState = action.__prevState || state;

    const marks = rule(prevState, state, action);
    const nextOb = applyMarks(ob, marks);
    if (!nextOb) return state;

    return { ...state, onboarding: nextOb };
  }

  // ─── Lifecycle reducers (moved from engine_core.js) ──────────────────────

  function onboardingLifecycle(state, action) {
    switch (action.type) {
      case A.ONBOARDING_QM_SEEN: {
        if (!action.messageKey) return state;
        const ob = state.onboarding || {};
        const seen = ob.qmMessagesSeen || {};
        if (seen[action.messageKey]) return state;
        return {
          ...state,
          onboarding: {
            ...ob,
            qmMessagesSeen: { ...seen, [action.messageKey]: true },
          },
        };
      }

      case A.ONBOARDING_SKIP: {
        const ob = state.onboarding || {};
        const allDone = {};
        Object.keys(ob.stepsCompleted || {}).forEach((k) => {
          allDone[k] = true;
        });
        // Remove the QM from the roster
        const roster = (state.crew?.roster || []).filter(
          (m) => !m.tags || !m.tags.includes("quartermaster")
        );
        const log = [...(state.log || [])];
        log.push(
          `[Day ${state.day}] The Quartermaster bids you farewell. "You've got the hang of it, Captain. I'll find my own way from here."`
        );
        return {
          ...state,
          log,
          crew: { ...state.crew, roster },
          onboarding: {
            ...ob,
            enabled: false,
            completed: true,
            stepsCompleted: allDone,
          },
        };
      }

      case A.ONBOARDING_COMPLETE: {
        const ob = state.onboarding || {};
        if (ob.completed) return state;
        const roster = (state.crew?.roster || []).filter(
          (m) => !m.tags || !m.tags.includes("quartermaster")
        );
        const log = [...(state.log || [])];
        log.push(
          `[Day ${state.day}] The Quartermaster disembarks with a satisfied nod. "Fair winds, Captain. You're ready."`
        );
        return {
          ...state,
          log,
          crew: { ...state.crew, roster },
          onboarding: { ...ob, enabled: false, completed: true },
        };
      }

      default:
        return state;
    }
  }

  // ─── Register both into the reducer chain ────────────────────────────────
  // Order matters:
  //   - Lifecycle reducer FIRST so explicit user actions (skip/complete) take
  //     precedence over anything else.
  //   - Middleware LAST so it sees the fully-resolved post-action state.

  window.E._reducers.push(onboardingLifecycle);
  window.E._reducers.push(onboardingMiddleware);
})();
